# 前端构建日志分析子代理

把 webpack、Vite、Rollup、esbuild、tsc、ESLint、PostCSS、Sass 等前端构建输出中的高噪声日志压缩成一份可执行诊断报告，让主 Agent 再决定如何修改代码。

## 解决什么问题

前端构建失败时，终端经常输出几十到几百行日志。里面通常混着真正的首个错误、重复堆栈、最终包装错误和非阻塞 warning。

`build-log-analyzer` 专门做一件事：找出最早能解释失败的有效错误，并返回根因、证据、失败分类和最小修复建议。

## 什么时候调用

- **构建失败且日志较长时调用**
  主 Agent 运行 `npm run build`、`pnpm build`、`vite build`、`tsc` 等命令后，如果退出码非 0，且输出里有大量堆栈或重复信息，就把日志交给这个子代理分析。

- **构建成功但 warning 很多时调用**
  比如 chunk size warning、deprecated API、Sass warning、PostCSS warning、TypeScript warning。构建虽然通过，但 warning 会影响上线或维护时，也适合让它归类风险。

- **用户直接提供构建日志时调用**
  用户说“帮我看看这段 Vite 构建报错”时，主 Agent 不需要在主上下文里逐行分析日志，直接委托给这个子代理。

- **干净成功时不要调用**
  如果构建成功且没有明显 warning，主 Agent 直接告诉用户构建通过即可，不需要浪费一次子代理调用。

## 主 Agent 怎么使用

1. 先保留原始构建命令、退出码和关键日志。
2. 如果日志很长，把日志内容或日志文件路径交给 `build-log-analyzer`。
3. 等子代理返回结构化报告后，只把根因和推荐修复用于后续决策。
4. 由主 Agent 执行实际代码修改、依赖调整或配置修复。

## 返回结果

子代理返回一份 `Build Log Analysis Report`，重点字段包括：

- `Status`：PASS / WARN / FAIL / BLOCKED
- `Toolchain`：识别出的构建工具
- `Primary Failure`：一句话概括首要失败
- `Root Cause`：最可能的根因
- `Evidence`：最短可用证据
- `Failure Category`：失败类型和阶段
- `Recommended Fix`：最小修复建议
- `Noise Suppressed`：被压缩掉的重复堆栈、包装错误或无关 warning

## 设计边界

- 只读分析：不改文件、不安装依赖、不更新 lockfile。
- 不主动复现构建：除非用户明确要求，否则只分析已有日志。
- 不替主 Agent 做修复：它只给诊断报告，后续修改由主 Agent 完成。
- 不追求全能：目标是快速提取构建失败信号，而不是做完整工程审计。
