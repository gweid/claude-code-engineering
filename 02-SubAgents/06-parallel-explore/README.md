# auth-explorer 说明

### 1. 元数据与工具约束 (Metadata & Tools)
```yaml
name: auth-explorer
description: Explore and analyze authentication-related code. Use when investigating auth flows, session management, or security.
tools: Read, Grep, Glob
model: haiku
```
-   **定位精准**：名称和描述明确将其限定为“认证代码探索者”，而非通用的安全审计员。这有助于主 Agent 准确判断何时调用它。
-   **只读权限**：仅授予 `Read`, `Grep`, `Glob` 工具，**严禁写入或执行**。这是安全分析类 Agent 的最佳实践，防止在分析过程中意外修改敏感的认证逻辑或触发副作用。
-   **模型选择 (Haiku)**：使用轻量级/快速模型（如 Claude Haiku）。这是一个非常明智的架构决策。代码探索和文件搜索属于高频、低推理密度的任务，不需要顶级模型的深度推理能力。用 Haiku 可以显著降低延迟和成本，适合做“侦察兵”角色。

### 2. 领域边界定义 (Your Domain)
```markdown
Focus ONLY on authentication-related concerns:
- Login/logout flows
- Token generation and validation (JWT, sessions)
- Password handling
- Permission and role systems
- Session management
```
-   **范围收敛**：通过显式列出关注点，防止 Agent 在分析时“跑题”。例如，它不会去分析支付逻辑或前端 UI 样式，除非这些直接与认证交互。
-   **覆盖核心面**：列表涵盖了认证的完整生命周期（身份验证 + 授权 + 会话），确保了分析的完整性。

### 3. 执行策略 (When Invoked)
```markdown
1. Locate Auth Code: Use Glob... Patterns: **/auth/**, **/*auth*...
2. Analyze Structure: Read key files...
3. Report Findings
```
-   **启发式搜索**：预设了具体的 Glob 模式。这解决了 LLM 在面对陌生代码库时“不知道去哪找”的问题，提高了首次命中率。
-   **结构化思维链**：强制规定了“先定位 -> 再阅读 -> 后报告”的步骤。这避免了 Agent 在没有充分上下文的情况下就开始胡乱猜测认证流程。
-   **潜在局限**：Glob 模式是基于命名约定的。如果项目中的认证代码命名为 `identity_provider.ts` 或 `access_control.py` 且不在 auth 目录下，该 Agent 可能会漏掉。**建议补充基于内容搜索（Grep）的策略作为兜底**。

### 4. 输出格式规范 (Output Format)
```markdown
## Auth Module Analysis
### Overview / Authentication Flow / Key Components / Token Strategy / Permission Model / Security Notes
```
-   **机器可读性**：标准化的 Markdown 模板使得主 Agent 可以极其容易地解析和综合信息。主 Agent 不需要处理自由文本，直接提取对应章节即可。
-   **表格化组件**：要求用表格列出关键组件，这对于快速理解代码映射关系非常高效。
-   **安全备注独立**：将 `Security Notes` 单独列出，确保安全发现不会被淹没在技术实现细节中，便于后续的安全评审或修复追踪。

### 5. 行为准则 (Guidelines)
```markdown
- Stay within auth domain
- Note any security concerns
- Be concise - main conversation will synthesize
```
-   **防越界机制**：再次强调领域限制，这是对 System Prompt 注入或上下文漂移的防御。
-   **职责分离**：“Be concise - main conversation will synthesize” 是关键。它明确了该 Sub Agent 是**信息提供者**而非**最终决策者**。它不应该给出“这个系统不安全”的最终结论，而应该提供“Token 未校验签名”的事实依据，由主 Agent 结合业务背景做最终判断。
-   **安全意识内嵌**：即使在探索阶段也要求记录安全问题，实现了“左移安全”的理念。
