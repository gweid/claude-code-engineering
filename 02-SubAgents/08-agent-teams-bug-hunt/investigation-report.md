# ShopStream Bug 调查报告

## 调查摘要

**调查日期**：2026-07-02  
**调查团队**：Session 侦探、数据库侦探、缓存侦探、架构侦探  
**调查对象**：ShopStream 电商平台 — 会话丢失/性能退化/数据泄漏

本次调查确认三个症状不是单一线性链条，而是多个架构缺陷在高峰期相互放大：

- **P0 数据泄漏**：订单私有响应被 URL 级公共缓存复用，且缓存层位于认证/授权之前；cache key 缺少用户身份和权限上下文，导致缓存命中时绕过 JWT 校验和 ownership 检查。
- **P2 API 变慢**：`/api/orders` 串行 N+1 查询叠加 DB pool `max=5` / `connectionTimeoutMillis=3000` 是直接瓶颈；缓存全局失效和无 single-flight 会制造突发回源，进一步放大尾延迟。
- **P1 会话丢失**：当前 API 鉴权主要依赖 JWT，不直接依赖 Redis session。P1 更准确理解为 JWT/session 双轨状态不一致：Session/Redis 保存、touch 和错误处理不可靠会影响依赖 cookie session 的入口、前端/网关/SSR 登录态判断，DB/cache 压力只是高峰期放大因素。

---

## 发现的 Bug 列表

### Bug #1: 订单私有响应在认证/授权前被公共 URL 缓存复用

- **文件**：`buggy-app/server.js:24`，`buggy-app/routes/orders.js:8-9`，`buggy-app/middleware/cache.js:22-27`
- **严重性**：P0
- **类型**：安全 / 认证绕过 / 授权绕过 / 数据隔离失败
- **描述**：`server.js` 在挂载 `orderRoutes` 前先执行 `cacheMiddleware('orders', 300)`，而 `orders.js` 内部才执行 `authMiddleware`。缓存命中时直接 `res.json(cached.data)`，不会进入 JWT 校验，也不会执行 `/api/orders/:id` 的 owner 检查。cache key 又只包含 URL，不包含 `userId`、session、token subject、tenant 或权限上下文。
- **代码片段**：
```javascript
// buggy-app/server.js:24
app.use('/api/orders', cacheMiddleware('orders', 300), orderRoutes);
```

```javascript
// buggy-app/routes/orders.js:8-9
// All routes require authentication
router.use(authMiddleware);
```

```javascript
// buggy-app/middleware/cache.js:22-27
const cacheKey = `${prefix}:${req.originalUrl}`;

const cached = cache.get(cacheKey);
if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
  return res.json(cached.data);
}
```

- **建议修复**：
```javascript
// 最保守：用户私有订单响应不使用共享缓存
app.use('/api/orders', orderRoutes);
```

```javascript
// 如果必须缓存，认证和授权必须先于缓存，并使用可信用户/权限上下文构造 key
router.use(authMiddleware);
router.use(cacheMiddleware('orders', 300));

// cache middleware 内部，在 req.userId 已可信后：
const cacheKey = `${prefix}:user:${req.userId}:${req.originalUrl}`;
```

> 重要边界：P0 不依赖 DB 慢查询或高峰期才成立。即使数据库查询本身正确包含 `user_id`，公共缓存命中仍可绕过正常路由路径，直接返回他人订单。

---

### Bug #2: 缓存所有 JSON 响应且丢失 HTTP 状态语义

- **文件**：`buggy-app/middleware/cache.js:42-50`
- **严重性**：P1 / P2
- **类型**：可靠性 / 缓存策略错误
- **描述**：缓存层 monkey-patch `res.json` 后无条件缓存所有 JSON body，不检查 `res.statusCode`，也不保存原始状态码。后续缓存命中时通常以默认 HTTP 200 返回错误 body，破坏认证、授权和 HTTP 状态语义。
- **代码片段**：
```javascript
// buggy-app/middleware/cache.js:42-50
const originalJson = res.json.bind(res);
res.json = (data) => {
  cache.set(cacheKey, {
    data: data,
    timestamp: Date.now(),
  });
  return originalJson(data);
};
```

- **建议修复**：
```javascript
res.json = (data) => {
  if (res.statusCode >= 200 && res.statusCode < 300) {
    cache.set(cacheKey, {
      data,
      statusCode: res.statusCode,
      timestamp: Date.now(),
    });
  }

  return originalJson(data);
};
```

更推荐使用显式 cache policy，而不是隐式劫持所有 `res.json`。

---

### Bug #3: 订单缓存全局失效且无 single-flight，导致高峰期突发回源

- **文件**：`buggy-app/routes/orders.js:155-156`，`buggy-app/middleware/cache.js:24-53`，`buggy-app/middleware/cache.js:60-65`
- **严重性**：P2
- **类型**：性能 / 并发控制 / 缓存失效策略错误
- **描述**：任意用户创建订单都会调用 `clearCache('orders')`，全局清空所有订单缓存，而不是只清理当前用户或具体订单资源。缓存 miss/过期后没有 per-key lock、in-flight promise 复用、request coalescing 或 stale-while-revalidate，高峰期会形成 thundering herd。
- **代码片段**：
```javascript
// buggy-app/routes/orders.js:155-156
// Clear orders cache for this user
clearCache('orders');
```

```javascript
// buggy-app/middleware/cache.js:60-65
function clearCache(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
```

- **建议修复**：
```javascript
// 精确失效当前用户或具体资源
clearCache(`orders:user:${req.userId}`);
```

```javascript
// 伪代码：为同一 cache key 合并并发 miss
if (inflight.has(cacheKey)) {
  const data = await inflight.get(cacheKey);
  return res.json(data);
}

const promise = fetchAndCache(cacheKey);
inflight.set(cacheKey, promise);
try {
  const data = await promise;
  return res.json(data);
} finally {
  inflight.delete(cacheKey);
}
```

---

### Bug #4: `/api/orders` 存在串行 N+1 查询

- **文件**：`buggy-app/routes/orders.js:18-39`
- **严重性**：P2
- **类型**：性能
- **描述**：订单列表先查询订单，再对每个订单逐个查询订单项。单个请求不会同时占满多个连接，但每个请求会产生 `1 + N` 次 `pool.query()`；并发用户会线性放大 query 数量，在小连接池下产生连接等待和累计尾延迟。
- **代码片段**：
```javascript
// buggy-app/routes/orders.js:18-39
const ordersResult = await query(
  'SELECT id, status, total, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
  [req.userId]
);

const orders = ordersResult.rows;

for (const order of orders) {
  const itemsResult = await query(
    'SELECT oi.id, oi.quantity, oi.price, p.name as product_name ' +
    'FROM order_items oi ' +
    'JOIN products p ON p.id = oi.product_id ' +
    'WHERE oi.order_id = $1',
    [order.id]
  );
  order.items = itemsResult.rows;
}
```

- **建议修复**：
```javascript
const result = await query(`
  SELECT
    o.id AS order_id,
    o.status,
    o.total,
    o.created_at,
    oi.id AS item_id,
    oi.quantity,
    oi.price,
    p.name AS product_name
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN products p ON p.id = oi.product_id
  WHERE o.user_id = $1
  ORDER BY o.created_at DESC
`, [req.userId]);

// 在应用层按 order_id 聚合为订单列表
```

---

### Bug #5: DB pool 过小且连接超时过短；慢查询计时包含 pool 等待

- **文件**：`buggy-app/db.js:12-16`，`buggy-app/db.js:27-35`
- **严重性**：P2
- **类型**：性能 / 资源管理
- **描述**：生产并发背景下 pool `max=5`、`connectionTimeoutMillis=3000` 过小/过短。`query()` 从调用 `pool.query()` 前开始计时，因此慢查询日志和请求耗时包含获取连接的等待时间。`/api/orders` 多次串行 query 的累计等待可以解释 p95 接近 3 秒、p99 超过 5 秒。
- **代码片段**：
```javascript
// buggy-app/db.js:12-16
max: 5,
idleTimeoutMillis: 5000,
connectionTimeoutMillis: 3000,
```

```javascript
// buggy-app/db.js:27-35
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}`);
    }
    return result;
```

- **建议修复**：
```javascript
const pool = new Pool({
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
});
```

同时增加连接获取耗时、pool wait、pool timeout、慢查询数量等指标。注意：调大 pool 不能替代修复 N+1。

---

### Bug #6: `POST /api/orders` 长事务挤压连接池，且 `getClient()` 在 try/catch 外

- **文件**：`buggy-app/routes/orders.js:94`，`buggy-app/routes/orders.js:103-153`，`buggy-app/routes/orders.js:163-168`，`buggy-app/db.js:46-48`
- **严重性**：P2
- **类型**：性能 / 可靠性 / 错误处理
- **描述**：`POST /api/orders` 在 finally 中正确 `client.release()`，不是连接泄漏。但它在事务内逐 item `SELECT`、`UPDATE`、`INSERT`，会长时间独占 1/5 连接；多个并发创建订单会压缩读接口可用连接。另一个可靠性风险是 `const client = await getClient()` 位于 try/catch 外，若 `pool.connect()` 因 3s 超时 reject，该错误不会进入当前 handler 的 catch/finally，在 Express 4 async route 下可能形成非结构化失败或未处理 rejection。
- **代码片段**：
```javascript
// buggy-app/routes/orders.js:93-96
router.post('/', async (req, res) => {
  const client = await getClient();

  try {
```

```javascript
// buggy-app/routes/orders.js:103-153
await client.query('BEGIN');
// 事务内逐 item SELECT products / UPDATE products / INSERT order_items
await client.query('COMMIT');
```

```javascript
// buggy-app/routes/orders.js:163-168
} finally {
  client.release();
}
```

- **建议修复**：
```javascript
router.post('/', async (req, res, next) => {
  let client;

  try {
    client = await getClient();
    await client.query('BEGIN');
    // transaction logic...
    await client.query('COMMIT');
    res.status(201).json({ orderId, total, status: 'pending' });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr.message);
      }
    }
    console.error('Create order error:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    if (client) client.release();
  }
});
```

---

### Bug #7: Redis session connect 不等待成功，error 只打日志

- **文件**：`buggy-app/middleware/session.js:14-20`
- **严重性**：P1
- **类型**：可靠性 / 错误处理
- **描述**：Redis 客户端连接失败时只打印日志，服务仍继续运行；`redisClient.connect()` 没有作为服务 ready 条件。session store 状态不可观测、不可靠。
- **代码片段**：
```javascript
// buggy-app/middleware/session.js:14-20
redisClient.on('error', (err) => {
  console.error('Redis session error:', err.message);
  // 没有重连！没有 fallback！没有告警！
});

// 连接 Redis（不等待连接成功就继续）
redisClient.connect().catch(console.error);
```

- **建议修复**：
```javascript
await redisClient.connect();

redisClient.on('error', (err) => {
  console.error('Redis session error:', err);
  // 告警、健康检查失败、必要时摘流
});
```

---

### Bug #8: `saveUninitialized=true` 与默认 Redis touch 增加高峰期 Redis 压力

- **文件**：`buggy-app/server.js:18-19`，`buggy-app/middleware/session.js:22-39`
- **严重性**：P1 / P2
- **类型**：性能 / 可靠性
- **描述**：`setupSession(app)` 全局注册，所有请求都会先经过 session middleware。`saveUninitialized: true` 会让新/空 session 也可能写入 Redis；当前 `RedisStore` 未关闭 touch，connect-redis 默认 touch 会刷新已有 session TTL，增加 Redis 压力。当前代码没有配置 `rolling`，因此不应把 rolling 作为证据点。
- **代码片段**：
```javascript
// buggy-app/server.js:18-19
// Session middleware
setupSession(app);
```

```javascript
// buggy-app/middleware/session.js:22-39
const store = new RedisStore({ client: redisClient });

app.use(session({
  store: store,
  secret: process.env.SESSION_SECRET || 'shopstream-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
```

- **建议修复**：
```javascript
const store = new RedisStore({
  client: redisClient,
  ttl: 24 * 60 * 60,
  // 是否 disableTouch 取决于是否需要滑动过期
});

app.use(session({
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
```

---

### Bug #9: 登录时 `req.session.save()` 不等待错误，形成 JWT/session 双轨不一致

- **文件**：`buggy-app/routes/auth.js:45-52`，`buggy-app/routes/auth.js:67-83`
- **严重性**：P1
- **类型**：可靠性 / 认证状态一致性
- **描述**：登录成功后写入 `req.session.userId/email`，但手动 `req.session.save()` 没有 callback，也没有等待或处理 Redis `store.set` 错误。客户端可能收到登录成功和 JWT，但服务端 session 未持久化，影响依赖 cookie session 的页面、入口、SSR、网关或前端登录态判断。注意：当前 `authMiddleware` 只读取 Authorization Bearer JWT，不读取 `req.session`，因此 Redis session 丢失不会直接导致当前 `/api/users` 或 `/api/orders` JWT 鉴权失败。
- **代码片段**：
```javascript
// buggy-app/routes/auth.js:45-52
req.session.userId = user.id;
req.session.email = user.email;

req.session.save();
```

```javascript
// buggy-app/routes/auth.js:67-83
const authHeader = req.headers.authorization;
const token = authHeader.split(' ')[1];
const decoded = jwt.verify(token, JWT_SECRET);
req.userId = decoded.userId;
req.userEmail = decoded.email;
next();
```

- **建议修复**：
```javascript
req.session.save((err) => {
  if (err) {
    console.error('Session save failed:', err);
    return res.status(503).json({ error: 'Login temporarily unavailable' });
  }

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});
```

并明确登录态来源：如果 API 只使用 JWT，应避免对所有 API 全局挂载 session middleware；如果需要 server-side session，则 Redis readiness 和 session save 失败必须进入可观测、可处理路径。

---

## 级联关系分析

### P2 主链

```text
缓存全局失效 / TTL 过期
  → 无 single-flight 的并发 miss
  → 大量请求同时回源 DB
  → /api/orders 串行 N+1 查询把每个 miss 放大为 1+N 次 pool.query()
  → db.js pool max=5 / connectionTimeoutMillis=3000
  → 连接等待、超时、累计尾延迟升高
  → /api/orders 变慢
  → /api/orders/:id 作为共享 pool 受害者一起变慢
```

### P0 主链

```text
cacheMiddleware 在 authMiddleware 前
  → cache key 缺少用户身份和权限上下文
  → 用户私有订单响应写入 URL 级公共缓存
  → 其他用户或无 Authorization 的请求访问相同 URL
  → cache hit 直接 res.json(cached.data)
  → 不进入 orderRoutes，不执行 JWT 校验和 owner check
  → 认证绕过 + 授权绕过 + 跨用户订单泄漏
```

### P0 放大链

```text
clearCache('orders') 全局失效
  → 无 single-flight 并发 miss
  → DB N+1 + 小连接池让响应完成顺序更不确定、miss/rebuild 窗口更长
  → 首个完成请求更容易污染共享 cache key
  → P0 更容易在高峰期被观察到
```

重要限定：P0 不依赖这条高峰期级联才成立。公共缓存命中本身已经是安全漏洞。

### P1 放大链

```text
DB N+1 + 小连接池
  → 高峰期 in-flight 请求增加
  → 全局 session middleware 触发更多 Redis get/touch/save 压力
  → Redis connect/error、saveUninitialized、login save 不等待等缺陷更容易暴露
  → 依赖 cookie session 的入口/前端/网关/SSR 可能表现为会话丢失
```

重要限定：当前仓库中 `/api/users` 和 `/api/orders` 的授权来自 JWT，不来自 Redis session；因此不能写成“Redis session 丢失直接导致当前 JWT API 鉴权失败”。

**关键洞察**：

- P0 是独立安全漏洞，必须立即修复，不能等待 DB 优化后观察。
- P2 是缓存失效/穿透和 DB 查询/连接池瓶颈共同造成。
- P1 的主线是 Session/Redis 与 JWT/session 双轨状态一致性问题；DB/cache 压力只是放大器。

---

## 与用户报告的症状对应

| 用户症状 | 直接原因 | 根本原因 | 涉及的 Bug |
|---------|---------|---------|-----------|
| 会话丢失 | 登录接口可能返回成功但 session 未可靠持久化；Redis session store 状态不可观测；依赖 cookie session 的入口/前端/网关/SSR 可能判断为未登录 | Redis connect 不等待、error 只日志、`req.session.save()` 不处理错误、`saveUninitialized=true` 与默认 touch 增加压力、JWT/session 双轨状态不清 | Bug #7, #8, #9 |
| API 变慢 | `/api/orders` 多次串行 `pool.query()` 在小 pool 上排队；`/api/orders/:id` 被共享 pool 拖慢 | 缓存全局失效/无 single-flight 制造突发回源；N+1 查询；DB pool `max=5` / `3s` timeout；POST 长事务挤压连接 | Bug #3, #4, #5, #6 |
| 数据泄漏 | 用户命中其他用户的订单缓存响应；无 Authorization 的 GET 若命中成功缓存也可能直接拿到订单数据 | 缓存层在认证/授权前执行；cache key 缺少用户身份和权限上下文；cache hit 绕过 JWT 和 owner check | Bug #1, #2 |

---

## 关于“刷新后恢复”的解释

不应主要归因于 300 秒 TTL 自然过期。更合理解释包括：

1. `POST /api/orders` 高频触发 `clearCache('orders')`，把污染缓存清掉。
2. 多个并发 miss 请求完成顺序不同，后完成响应覆盖同一个公共 key。
3. 刷新时 URL query string 变化，例如 cache buster，形成新 key。
4. 缓存是进程内 `Map`；多实例/多进程部署时缓存不一致，请求可能落到另一个没有污染缓存的实例。

进程内 `Map` 还存在额外架构风险：无容量上限、TTL 惰性清理、`clearCache` 只清当前进程。这些是补充风险和现象解释，不作为已证明根因。

---

## 修复优先级建议

1. **立即修复 P0：缓存鉴权边界与用户隔离**
   - 暂停 `/api/orders` 当前共享缓存。
   - 认证和授权必须先于任何用户私有响应缓存。
   - 默认不缓存私有订单响应；如必须缓存，key 必须包含可信 `req.userId`、tenant、角色/权限上下文。
   - `/api/orders/:id` 不能通过缓存绕过 owner check。
   - 只缓存明确可缓存的 2xx 响应，不缓存 401/403/404/500。

2. **修复缓存策略与并发控制**
   - 将 `clearCache('orders')` 改为用户级或资源级精确失效。
   - 增加 single-flight / request coalescing / stale-while-revalidate。
   - 为进程内缓存增加容量上限和主动清理；多实例场景使用集中式缓存或避免依赖进程内一致性。

3. **修复 P2 数据库瓶颈**
   - 消除 `/api/orders` N+1 查询。
   - 重新评估 `pg` pool `max`、`connectionTimeoutMillis`、`idleTimeoutMillis`。
   - 增加连接获取耗时、pool 等待、pool 超时、慢查询、事务持续时间指标。
   - 优化 `POST /api/orders` 长事务，避免逐 item 长时间占用 dedicated client。
   - 将 `getClient()` 移入 try/catch，确保连接获取失败也结构化处理。

4. **修复 P1 Session/Redis 状态模型**
   - 明确登录态来源：JWT 或 server-side session，避免双轨不一致。
   - Redis 连接成功应作为服务 ready 条件。
   - Redis error 不能只打日志，应告警、健康检查失败、必要时摘流。
   - 设置 `saveUninitialized: false`。
   - 登录时等待 `req.session.save()` callback 并处理失败。
   - 明确 RedisStore touch / TTL 策略；如果 API 只使用 JWT，不要对所有 API 全局挂载 session middleware。

---

## 调查过程记录

### Teammate 发现

- **Session 侦探**：
  - 确认 `rolling` 不是当前代码证据；压力点是 `saveUninitialized=true` 与 RedisStore 默认 touch。
  - 发现登录 `req.session.save()` 不等待 callback，是 session 静默保存失败的最强路径。
  - 明确当前受保护 API 使用 JWT，不读取 `req.session`，因此 Redis session 丢失不会直接导致 `/api/orders` 或 `/api/users` JWT 鉴权失败。

- **数据库侦探**：
  - 发现 `db.js` pool `max=5`、`connectionTimeoutMillis=3000`。
  - 发现 `/api/orders` 串行 N+1 查询。
  - 补充 `query()` duration 包含 pool 等待，解释 p95/p99 与连接池等待机制匹配。
  - 确认 `POST /api/orders` 不是连接泄漏，但长事务会挤压连接池；`getClient()` 在 try/catch 外是高峰期错误处理风险。

- **缓存侦探**：
  - 确认 `cacheMiddleware` 在 `authMiddleware` 前执行。
  - 确认 cache key 缺少用户身份和权限上下文。
  - 补充缓存错误响应污染、全局清缓存、无 single-flight、进程内 `Map` 无容量/多实例不一致等风险。
  - 明确 P0 是独立安全漏洞，DB 慢只是放大器。

- **架构侦探**：
  - 综合确认 middleware 顺序构成 P0 安全漏洞。
  - 确认 DB pool/N+1 对 P2 因果链成立，`/api/orders/:id` 是共享池受害者。
  - 确认 P1 应带 API/JWT 边界：Session/Redis 是高疑点，但不能写成 Redis session 丢失直接导致当前 JWT API 鉴权失败。

### 关键交叉发现

1. **缓存 × 架构**：缓存层位于认证/授权前，cache hit 是绕过 `authMiddleware` 和 owner check 的短路路径。
2. **缓存 × DB**：全局失效和无 single-flight 制造突发回源；DB N+1 和小 pool 把突发回源变成尾延迟。
3. **DB × Session**：DB 慢不会直接丢 session，但会增加 in-flight 请求和 Redis get/touch/save 压力，暴露 Session/Redis 缺陷。
4. **Session × 架构**：JWT/session 双轨状态不清；当前 API 用 JWT，但登录流程仍写 session，若 session save 静默失败会造成客户端/页面/网关层状态不一致。

---

## 最终结论

```text
本次事故由多个架构缺陷共同造成：订单缓存层位于鉴权之前且 cache key 缺少用户身份和权限上下文，直接导致 P0 认证绕过、授权绕过和跨用户订单泄漏；订单列表串行 N+1 查询叠加过小 DB 连接池，并被缓存全局失效和无 single-flight 放大，直接导致 P2 高峰期订单 API 变慢；Session/Redis 未可靠连接、未处理登录 save 失败、saveUninitialized=true、默认 touch 与 JWT/session 双轨状态模型共同构成 P1 会话丢失的高疑点。高峰期订单流量、全局订单缓存失效和 DB 连接池排队进一步增加 in-flight 请求与 Redis session 压力，使这些问题互相放大。
```
