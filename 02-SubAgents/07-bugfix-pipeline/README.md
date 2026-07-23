使用：

```bash
我有一个 bug：用户登录后偶尔会 token 验证失败
帮我用流水线方式修复：
1. 先让 bug-locator 找到相关代码
2. 让 bug-analyzer 分析原因
3. 让 bug-fixer 修复
4. 让 bug-verifier 跑测试验证
```



关键阶段审批：

```bash
帮我修复这个 bug：用户登录后偶尔 token 验证失败
执行方式：
1. 先让 bug-locator 定位 → 自动传给 bug-analyzer
2. bug-analyzer 分析完后 → 先给我看根因分析，我确认后再继续
3. 我确认后 → 让 bug-fixer 修复 → 自动传给 bug-verifier
4. bug-verifier 验证完给我最终报告
```
