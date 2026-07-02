# Skills 技能

## SKILL.md 结构与触发机制

### 什么是 Skills

在真实的工程团队里，很少有人能够把所有规范背下来

代码风格指南十几页，Git 提交规范三四种类型，API 设计有版本约定，安全审查有检查清单，部署流程有风险控制条款……这些规则并不复杂，但数量一多，就不可能长期驻留在脑中。人类工程师的做法很简单：需要时再查阅

如果把 Claude 当作真正的工程助手，它也会面临同样的问题。最直接的做法，是把所有团队规范写进 CLAUDE.md，让模型每次对话都读取这些内容。短期看这是可行的。但当知识规模扩大到几十页甚至上百页时，每一次对话都在为“可能用不到的知识”支付上下文成本。这不仅消耗 tokens，更重要的是，它会稀释模型的注意力。真正需要用到的规则，反而淹没在冗余信息里

这正是 Skills 需要解决的问题




Skills 并不是简单的“能力扩展机制”，它本质上是一种按需加载的认知结构。与其把所有知识常驻在上下文中，不如把它们封装成可独立触发的能力单元。当模型判断当前任务涉及某个特定领域时，再加载对应的知识与操作流程

Skills 更精确的定义：**Skills 是一种可被语义触发的能力包，它包含领域知识、执行步骤、输出规范与约束条件，并在需要时渐进式加载到主 Agent 的认知空间中**




Agent 生态中的四大支柱：

![](./imgs/img56.png)

- **Tools 是行动原语**。它回答的是能做什么。读文件、改代码、执行 Bash 命令……这些是操作层面的能力，类似人的双手
- **SubAgents 是执行分工**。它回答的是谁来做。当任务复杂到需要独立上下文时，子代理承担专职职责，类似团队中的同事
- **Hooks 是流程规则**。它回答的是什么时候检查。它们在关键节点自动触发质量校验或合规约束，类似企业中的质检流程
- 而 Skills 回答的，是另外一个非常关键的问题：“怎么做，以及何时做 ”，它不是工具，也不是分工机制。它是一种可操作知识结构

Skills 解决的核心问题是，在有限的上下文窗口中，让 Agent 在正确的时刻拥有正确的领域知识




### Skills 的核心生态位：可操作知识

一份 API 设计指南放在 Wiki 上，是静态文本。它不包含触发条件，不定义执行流程，不规定输出结构，也不会自动校验质量。它等待人去阅读

而一个 Skill，则是一段具备语义入口的标准操作程序。它通过 description 告诉模型：在什么情况下应该加载这项能力。它在正文中定义执行步骤，将抽象原则转化为可执行流程。它通过模板约束输出格式，确保结果标准化。它可以限制可调用工具的范围，防止越权操作。它甚至可以通过 hooks 在完成后自动执行验证逻辑

把文档封装为 Skill，它就不再是参考资料，而成为一种可被调用的行为模式。从工程视角看，这是对上下文资源的优化；但从系统设计视角看，这是一种更深层的变化




过去的软件体系中，调度权始终掌握在人类手中。工程师写 Prompt、编排 Workflow、定义调用顺序。模型只是执行者。Skills 的真正突破点，**在于它把能力的“语义定义权”交给模型**

人不再编排具体执行路径，而是定义能力的边界与含义。模型根据 description 理解能力语义，并在运行时决定是否加载、何时加载




### Skills 是组织的 SOP 体系

如果把 Claude Code 的技术栈映射到企业组织结构，我们会发现一种高度对称的关系。Tools 对应员工的操作工具；SubAgents 对应岗位分工；Hooks 对应质量与合规流程；CLAUDE.md 类似企业文化与通用规章；MCP Servers 像外部合作伙伴；Plugins 是对外打包的解决方案。

而 Skills，正是企业的 SOP 体系。

![](./imgs/img57.png)

一个成熟的企业不会要求员工背诵全部操作手册。相反，它建立标准操作程序，在具体任务发生时按需查阅，并按照步骤执行，输出标准化结果。当新员工进行代码审查时，他不会即兴发挥。他会参考《代码审查 SOP》，按步骤检查，最后输出符合模板的报告

Claude 在加载 code-review Skill 时，所做的事情，本质上是同一个过程。从这个角度看，Skills 不再只是技术机制，而是一种企业经验的结构化表达方式。

当组织的“做事方式”被封装为可语义调用的能力单元，经验就不再依附于老员工的记忆，也不再散落在文档系统中。它变成模型可以理解、选择和继承的结构。

对于企业来说，**把专业流程、领域知识和行动判断封装成可复用的能力单元，然后让智能体按需加载和调用，这是一种让通用模型具备专业化、按需调用能力的通用设计模式**。类似 Skills 的模块化能力已经被用于数据分析、校验、报告生成等任务，把自然语言指令转化成结构化的专业工作流；也有技术方案将企业组件库、开发规范等封装成“技能包”，让模型自动发现、理解并正确应用这些业务能力。




### Skills 触发机制

在 Claude Code中，Skills 默认情况下支持两种触发方式：

![](./imgs/img58.png)

这是 Skills 最重要的设计特性：**同一个 Skill 既可以作为斜杠命令使用，也可以让 Claude 自动判断何时需要**

![](./imgs/img59.png)

两种方式调用的是同一个 Skill，执行的是同样的指令。

和Sub-Agents类似，Skills 的触发机制**靠 LLM 语义推理，而非精确匹配**。Claude 读取所有 Skills 的 description，通过语义理解判断当前对话是否匹配某个 Skill




当用户发送消息时，Claude 的处理流程如下图所示：

![](./imgs/img60.png)




假设有 5 个 Skills，每个 SKILL.md 约 1000 tokens：

![](./imgs/img61.png)

可以看到，**渐进式加载时Token的节省比例高达78% ~ 98%**。这就是为什么 Skills 采用“渐进式披露”而非“一次性加载”




当用户请求可能匹配多个 Skills 时，Claude 会：

1. 评估每个 Skill 的 description 与用户请求的相关性
2. 选择最相关的那个
3. 如果不确定，可能会询问用户或使用通用方式处

> 注意：设有 disable-model-invocation: true 的 Skill，其 description 不会加载到上下文。Claude 完全看不到它，只有用户 /name 才能触发




另外，可以采用三种方式来控制 Claude 对 Skills 的访问。

- 全局禁用：在 /permissions 中 deny Skill 工具
- 精确控制：Skill(commit) 精确匹配，Skill(deploy *) 前缀匹配
- 逐个控制：给 Skill 加 disable-model-invocation: true frontmatter




好的 Skill 设计**遵循“导航页 + 详情页 ”模式**

```yml
SKILL.md                    ← 导航页：概述 + 引用（< 500 行）
├── reference.md            ← 详情页：详细 API 文档
├── examples.md             ← 详情页：使用示例
└── scripts/validate.sh     ← 工具：可执行脚本
```

注意： SKILL.md 应该被控制在 500 行以内。如果过于复杂，应该将详细参考资料移到独立文件，并在 SKILL.md 中进行引用（也就是常说的渐进式加载）

Skills 的存放位置决定了谁能使用它，以及优先级顺序：

![](./imgs/img62.png)

同名优先级：Enterprise > Personal > Project。Plugin Skills 使用 plugin-name:skill-name 命名空间，不与其他级别冲突。

当在子目录（如 packages/frontend/）中工作时，Claude Code 会自动发现该目录下的 .claude/skills/。这种 monorepo 的 Skills 自动发现机制让 monorepo 中的每个 package 都可以有自己的 Skills




### Skills 的两大类型：参考型和任务型

从工程角度，Skill 内容分为两类，参考型和任务型。参考型 Skill 影响“怎么做”，任务型 Skill 决定“做什么”

在写 description 时需要明确它属于哪种类型：

![](./imgs/img63.png)



参考型 skill 自动选择是否使用

```md
---
name: api-conventions
description: API设计模式，适用于此代码库。在编写或审查API端点时使用。
---
```




任务型 skill 通常由用户手动触发

```md
---
name: deploy
description: 部署应用程序到生产
disable-model-invocation: true
---
```




参考型 Skill 更像组织的行为规范层。它定义例如 API 设计标准、代码风格、错误处理约定。这类 Skill 通常由模型根据语义自动判断是否加载，不主导行动，而是塑造行动的方式

任务型 Skill 则更像组织的操作流程层。它定义一次明确的行动：部署、发布、迁移、生成报告等。这类行为具有边界和风险，通常需要显式触发，因此常配合 disable-model-invocation 使用




### Skills 文件结构

> 完整示例在：03-Skills/01-reference-skill




在Claude Code中，每个 Skill 独占一个目录。其标准的目录和文件结构如下：`.claude/skills/<skill-name>/SKILL.md`


```yml
.claude/skills/api-conventions/     # skill 目录，名称即 skill 名
└── SKILL.md                        # 主文件（必需）
```

配置：

````md
---
name: api-conventions
description: API design patterns and conventions for this project. Covers RESTful URL naming, response format standards, error handling, and authentication requirements. Use when writing or reviewing API endpoints, designing new APIs, or making decisions about request/response formats.
allowed-tools:
  - Read
  - Grep
  - Glob
---

# API Design Conventions

These are the API design standards for our project. Apply these conventions whenever working with API endpoints.

## URL Naming

- Use plural nouns for resources: `/users`, `/orders`, `/products`
- Use kebab-case for multi-word resources: `/order-items`, `/user-profiles`
- Nested resources for belongsTo relationships: `/users/{id}/orders`
- Maximum two levels of nesting; beyond that, use query parameters
- Use query parameters for filtering: `/orders?status=active&limit=20`

## Response Format

All API responses must follow this structure:

```json
{
  "data": {},
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

- `data`: 成功时返回的业务数据
- `error`: 错误时返回错误对象 `{ code, message, details }`，成功时为 `null`
- `meta`: 分页和元信息，列表接口必须返回

## HTTP Status Codes

- 200: 成功返回数据
- 201: 成功创建资源
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 422: 业务逻辑错误
- 500: 服务器内部错误

## Authentication

- All endpoints require Bearer token unless explicitly marked as public
- Public endpoints must be documented with `@public` annotation
- Token format: `Authorization: Bearer <jwt-token>`

## Versioning

- API version in URL path: `/api/v1/users`
- Breaking changes require new version
````

这个文件有三个部分：

- YAML frontmatter，是通过`---`包裹的元数据
- Markdown 正文，是技能的具体说明
- 辅助文件：.claude/skills/<skill-name>/SKILL.md。每个 Skill 在自己的目录中，可以包含辅助文件（当前 skill 暂时没有）

这是一个典型的参考型 Skill：

- 没有执行步骤 ：不是先做A再做B，而是“遵循这些规范”
- 没有输出模板 ：不要求 Claude 输出固定格式的报告
- 没有设 disable-model-invocation：Claude 可以自动判断何时需要
- 只读工具 ：allowed-tools 限制为 Read/Grep/Glob，因为规范查阅不需要改代码

Claude 选择是否激活一个 Skill，完全依赖于阅读 description。这不是关键词匹配，而是语义理解。**description 是 Skill 的灵魂，因为它不是给人看的文档，而是给 Claude 看的触发器**




**好的 description 与差的对比**

```yml
description: 处理PDF文件

很明显，问题在于太模糊，“handles”是什么意思？读取？转换？合并？Claude 不知道什么时候该用它。用户说“帮我处理这个 PDF”时，Claude 可能不确定这个 Skill 是否合适。



description: 从PDF文件中提取文本和表格，填写表格，合并文档。当处理PDF文件或用户提及PDF、表格或文档提取时使用。

为什么这版更好？因为它列出了具体动作（extract, fill, merge）；包含了用户可能说的关键词（PDF, forms, document extraction）；明确说明了触发场景（“Use when…”）
```




description 书写公式：**description = [做什么] + [怎么做] + [什么时候用]**

几个套用公式的示例：

```md
# 代码审查 Skill
description: 审查代码的质量、安全性和最佳实践。检查错误、性能问题和风格违规。当用户请求代码审查、希望获得代码反馈、提及审查更改或询问代码质量时使用。


# API 文档 Skill
description: 从代码生成API文档。提取端点、参数和响应模式。当用户想要记录API、创建API参考、生成端点文档或需要帮助处理OpenAPI/Swagger规范时使用。

# 数据库查询 Skill
description: 查询数据库并分析结果。支持SQL生成、查询优化和结果解释。当用户询问数据、想要运行查询、需要数据库信息或提及表/模式时使用。
```




有多个 Skills 时，确保 description 有明确区分：

```md
# ❌ 容易冲突
name: unit-testing
description: 编写代码测试

name: integration-testing
description: 编写代码测试



# ✅ 明确区分
name: unit-testing
description: 编写和运行针对单个函数的单元测试。用于单独测试单个函数或方法，模拟依赖关系，并验证函数行为。

name: integration-testing
description: 编写和运行系统组件的集成测试。用于测试多个组件如何协同工作、测试API端点端到端或验证数据库交互。
```



### Skills Frontmatter 字段详解

Claude Code 支持的完整 frontmatter 字段如下：

```md
---
name: my-skill-name                # 可选：Skill 标识符（省略则用目录名）
description: What this does        # 推荐：触发器（最重要！）
argument-hint: "[issue-number]"    # 可选：自动补全时的参数提示
disable-model-invocation: true     # 可选：禁止 Claude 自动触发
user-invocable: false              # 可选：对用户隐藏 /skill-name
allowed-tools:                     # 可选：限制可用工具
  - Read
  - Grep
  - Glob
model: sonnet                      # 可选：指定执行模型
context: fork                      # 可选：在子代理中隔离执行
agent: Explore                     # 可选：context: fork 时的代理类型
hooks:                             # 可选：作用域为此 Skill 的 Hooks
  PreToolUse:
    - matcher: Write
      hooks:
        - type: command
          command: "echo 'Write called in skill'"
---
```

- name 字段：最大 64 字符，只能使用小写字母、数字、连字符，推荐使用动名词形式：code-reviewing、api-documenting、bug-fixing。如果省略了这个字段，则自动使用目录名（.claude/skills/code-reviewing/ → name 为 code-reviewing）

- description 字段：这是最重要的字段。它决定 Skill 何时被触发。这个字段应该包含两部分信息：这个 Skill 做什么，以及什么情况下使用它。如果省略了这个字段，系统会使用 Markdown 正文的第一段作为 description
  > 注意：所有 Skill 的 description 会被加载到上下文中供 Claude 判断选择，默认总预算为 15,000 字符。如果你的 Skills 很多，导致 description 被截断，可以运行 /context 查看警告，并通过环境变量 SLASH_COMMAND_TOOL_CHAR_BUDGET 调大预算

- argument-hint 字段：自动补全提示，为用户提供参数格式提示，在输入 /skill-name 时系统会自动补全显示

- disable-model-invocation 和 user-invocable 这两个字段组合起来控制“谁能触发这个 Skill”
  ![](./imgs/img64.png)

  > 凡是带副作用的Skil，也就是有系统性影响的 Skill：比如部署、发消息、改配置，一定要设 disoble-model-invocation：true

- allowed-tools 字段用来限制 Skills 被激活时 Claude 能使用的工具。Skills 支持的工具包括：
  ![](./imgs/img65.png)

  还可以更精细地控制 Bash 命令：
  ```md
  allowed-tools:
    - Bash(git:*)      # 只能执行 git 命令
    - Bash(npm test:*) # 只能执行 npm test 相关命令
  ```

- context、agent、model：Skills的执行环境
  ![](./imgs/img66.png)

- hooks：Skill 级别的 Hooks，可以为 Skill 定义仅在其生命周期内生效的 Hooks




### 总结

Skills 重点：

- **Skills 是可由用户或 Claude 触发的能力包**，Claude 通过语义推理决定何时激活，但目前已经脱离了Claude Code本身，形成了 Agent 通用技能生态。
- **Skill 的 description 不是文档，而是触发器**，其构建公式为：做什么 + 怎么做 + 什么时候用
- **Claude Code 采用渐进式加载**来节省 token。description 常驻上下文，全文仅在触发时加载




什么时候用参考型Skill，什么时候用任务型Skill？什么时候必须手动触发？

![](./imgs/img67.png)

简而言之，CLAUDE.md 放“Claude 每次都该知道的少量规则”（< 100 行）；Skill 放“特定场景下的详细指令和知识”（可以很长，按需加载）。**如果犹豫放 CLAUDE.md 还是 Skill，那么就放 Skill，并在 CLAUDE.md 里加一行引用**。

