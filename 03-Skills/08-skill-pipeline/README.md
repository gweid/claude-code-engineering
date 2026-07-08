流水线编排在 CLAUDE.md 中

使用

```bash
# 运行完整流水线
> 对当前目录下 src/ 目录运行文档流水线



# 或者分阶段手动运行
> 用 route-scanner 扫描 src/ 目录的路由
> 用 doc-writer 根据上面的路由清单生成文档
> 用 quality-checker 验证 docs/ 目录下生成的文档
```
