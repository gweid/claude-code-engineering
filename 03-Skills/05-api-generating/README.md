# API 文档生成 Skill

一个可用于生产场景的 Skill，用于从源码生成 API 文档。

## 功能

- **多框架支持**：Express.js、FastAPI、Spring Boot、Go（Gin/Echo）
- **多种输出格式**：Markdown、OpenAPI 3.0
- **自动路由检测**：用于批量处理的 Python 脚本
- **校验工具**：OpenAPI 规范校验

## 结构

```yaml
api-generator/
├── SKILL.md                    # 主 Skill 文件
├── PATTERNS.md                 # 框架检测模式
├── STANDARDS.md                # 文档标准
├── EXAMPLES.md                 # 输入/输出示例
├── templates/
│   ├── index.md                # API 索引模板
│   ├── endpoint.md             # 端点文档模板
│   └── openapi.yaml            # OpenAPI 规范模板
└── scripts/
    ├── detect_routes.py        # 路由检测脚本
    └── validate_openapi.sh     # OpenAPI 校验脚本
```

## 使用示例

### 单个端点文档

让 Claude 为指定端点生成文档：
```
请为这个 Express 路由生成文档：
router.get('/users/:id', userController.getUser);
```

### 批量生成文档

扫描整个目录：

```bash
扫描 src/routes 目录，并为所有端点生成 API 文档。
```

### 生成 OpenAPI

生成 OpenAPI 规范：

```bash
为 src/api 中定义的 API 生成 OpenAPI 3.0 规范。
```

## 脚本

### 路由检测

```bash
# 检测所有路由
python scripts/detect_routes.py src/

# 只检测 Express 路由
python scripts/detect_routes.py src/ --framework express

# 保存到文件
python scripts/detect_routes.py src/ -o routes.json
```

### OpenAPI 校验

```bash
# 校验 OpenAPI 规范
./scripts/validate_openapi.sh api-spec.yaml
```

## allowed-tools 配置

这个 Skill 使用：
- `Read` - 读取源码文件
- `Grep` - 搜索路由模式
- `Glob` - 查找文件
- `Write` - 创建文档文件
- `Bash(python:*)` - 运行 Python 脚本
- `Bash(./scripts/*:*)` - 运行项目脚本

没有 `Edit` 权限：这个 Skill 会创建新文件，但不会修改已有文件。
