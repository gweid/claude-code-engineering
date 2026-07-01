# 前端构建日志分析子代理

**内容主要包含：**

- build-log-analyzer frontmatter 配置
- 只读约束：不改文件、不安装依赖、不更新 lockfile
- 支持 webpack / Vite / Rollup / esbuild / tsc / ESLint / CSS 构建日志
- 构建失败分类方法
- 结构化输出格式：Status、Toolchain、Primary Failure、Root Cause、Evidence、Recommended Fix




**触发规则：**

- 构建失败时主动调用
  主 Agent 运行 npm run build / pnpm build / vite build 后，如果退出码非 0，日志又比较长，就应该把构建输出交给 build-log-analyzer，让它提炼根因。

- 构建成功但 warning 很多时调用
  比如有大量 chunk size warning、deprecated API、Sass warning、PostCSS warning、TypeScript warning。虽然构建成功，但如果这些 warning 会影响后续维护或上线，也适合调用。

- 用户直接提供构建日志时调用
  用户说“帮我看看这段 Vite 构建报错”，主 Agent 不需要自己分析长日志，直接委托给这个 SubAgent。

- 不应该在干净成功时调用
  如果构建成功且没有明显 warning，主 Agent 直接告诉用户构建通过即可，不需要浪费一次子代理调用。

