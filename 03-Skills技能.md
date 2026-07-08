# Skill 技能




## SKILL.md 结构与触发机制




### 什么是 Skill

在真实的工程团队里，很少有人能够把所有规范背下来

代码风格指南十几页，Git 提交规范三四种类型，API 设计有版本约定，安全审查有检查清单，部署流程有风险控制条款……这些规则并不复杂，但数量一多，就不可能长期驻留在脑中。人类工程师的做法很简单：需要时再查阅

如果把 Claude 当作真正的工程助手，它也会面临同样的问题。最直接的做法，是把所有团队规范写进 CLAUDE.md，让模型每次对话都读取这些内容。短期看这是可行的。但当知识规模扩大到几十页甚至上百页时，每一次对话都在为“可能用不到的知识”支付上下文成本。这不仅消耗 tokens，更重要的是，它会稀释模型的注意力。真正需要用到的规则，反而淹没在冗余信息里

这正是 Skill 需要解决的问题




Skill 并不是简单的“能力扩展机制”，它本质上是一种按需加载的认知结构。与其把所有知识常驻在上下文中，不如把它们封装成可独立触发的能力单元。当模型判断当前任务涉及某个特定领域时，再加载对应的知识与操作流程

Skill 更精确的定义：**Skill 是一种可被语义触发的能力包，它包含领域知识、执行步骤、输出规范与约束条件，并在需要时渐进式加载到主 Agent 的认知空间中**




Agent 生态中的四大支柱：

![](./imgs/img56.png)

- **Tools 是行动原语**。它回答的是**能做什么**。读文件、改代码、执行 Bash 命令等，这些是操作层面的能力，类似人的双手
- **SubAgents 是执行分工**。它回答的是**谁来做**。当任务复杂到需要独立上下文时，子代理承担专职职责，类似团队中的同事
- **Hooks 是流程规则**。它回答的是**什么时候检查**。它们在关键节点自动触发质量校验或合规约束，类似企业中的质检流程
- 而 Skill 回答的，是另外一个非常关键的问题：**怎么做，以及何时做**，它不是工具，也不是分工机制。它是一种可操作知识结构

Skill 解决的核心问题是：**在有限的上下文窗口中，让 Agent 在正确的时刻拥有正确的领域知识**




### Skill 的核心生态位：可操作知识

一份 API 设计指南放在 Wiki 上，是静态文本。不包含触发条件，不定义执行流程，不规定输出结构，也不会自动校验质量。它等待人去阅读



而一个 Skill，则是一段具备语义入口的标准操作程序。通过 description 告诉模型：在什么情况下应该加载这项能力。在正文中定义执行步骤，将抽象原则转化为可执行流程。通过模板约束输出格式，确保结果标准化。可以限制可调用工具的范围，防止越权操作。甚至可以通过 hooks 在完成后自动执行验证逻辑



把文档封装为 Skill，它就不再是参考资料，而成为一种可被调用的行为模式。从工程视角看，这是对上下文资源的优化；但从系统设计视角看，这是一种更深层的变化




过去的软件体系中，调度权始终掌握在人类手中。工程师写 Prompt、编排 Workflow、定义调用顺序。模型只是执行者。Skill 的真正突破点，**在于它把能力的“语义定义权”交给模型**

人不再编排具体执行路径，而是定义能力的边界与含义。模型根据 description 理解能力语义，并在运行时决定是否加载、何时加载




### Skill 是组织的 SOP 体系

如果把 Claude Code 的技术栈映射到企业组织结构，会发现一种高度对称的关系：

- Tools 对应员工的操作工具
- SubAgents 对应岗位分工
- Hooks 对应质量与合规流程
- CLAUDE.md 类似企业文化与通用规章
- MCP Servers 像外部合作伙伴
- Plugins 是对外打包的解决方案。
- 而 Skill，正是企业的 SOP 体系

![](./imgs/img57.png)

一个成熟的企业不会要求员工背诵全部操作手册。相反，它建立标准操作程序，在具体任务发生时按需查阅，并按照步骤执行，输出标准化结果。当新员工进行代码审查时，他不会即兴发挥。他会参考《代码审查 SOP》，按步骤检查，最后输出符合模板的报告

Claude 在加载 code-review Skill 时，所做的事情，本质上是同一个过程。从这个角度看，Skill 不再只是技术机制，而是一种企业经验的结构化表达方式。

当组织的“做事方式”被封装为可语义调用的能力单元，经验就不再依附于老员工的记忆，也不再散落在文档系统中。它变成模型可以理解、选择和继承的结构。

对于企业来说，**把专业流程、领域知识和行动判断封装成可复用的能力单元，然后让智能体按需加载和调用，这是一种让通用模型具备专业化、按需调用能力的通用设计模式**。类似 Skill 的模块化能力已经被用于数据分析、校验、报告生成等任务，把自然语言指令转化成结构化的专业工作流；也有技术方案将企业组件库、开发规范等封装成“技能包”，让模型自动发现、理解并正确应用这些业务能力




### Skill 触发机制

在 Claude Code 中，Skill 默认情况下支持两种触发方式：

![](./imgs/img58.png)

这是 Skill 最重要的设计特性：**同一个 Skill 既可以作为斜杠命令使用，也可以让 Claude 自动判断何时需要**

![](./imgs/img59.png)

两种方式调用的是同一个 Skill，执行的是同样的指令。

和 Sub-Agents 类似，Skill 的触发机制**靠 LLM 语义推理，而非精确匹配**。Claude 读取所有 Skill 的 description，通过语义理解判断当前对话是否匹配某个 Skill




当用户发送消息时，Claude 的处理流程如下图所示：

![](./imgs/img60.png)




假设有 5 个 Skill，每个 SKILL.md 约 1000 tokens：

![](./imgs/img61.png)

可以看到，**渐进式加载时Token的节省比例高达78% ~ 98%**。这就是为什么 Skill 采用“渐进式披露”而非“一次性加载”




当用户请求可能匹配多个 Skill 时，Claude 会：

1. 评估每个 Skill 的 description 与用户请求的相关性
2. 选择最相关的那个
3. 如果不确定，可能会询问用户或使用通用方式处

> 注意：设有 disable-model-invocation: true 的 Skill，其 description 不会加载到上下文。Claude 完全看不到它，只有用户 /name 才能触发




另外，可以采用三种方式来控制 Claude 对 Skill 的访问。

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

> 注意： SKILL.md 应该被控制在 500 行以内。如果过于复杂，应该将详细参考资料移到独立文件，并在 SKILL.md 中进行引用（也就是常说的渐进式加载）



Skill 的存放位置决定了谁能使用它，以及优先级顺序：

![](./imgs/img62.png)

同名优先级：Enterprise > Personal > Project。Plugin Skill 使用 plugin-name:skill-name 命名空间，不与其他级别冲突。

当在子目录（如 `packages/frontend/`）中工作时，Claude Code 会自动发现该目录下的 `.claude/Skill/`。这种 monorepo 的 Skill 自动发现机制让 monorepo 中的每个 package 都可以有自己的 Skill




### Skill 的两大类型：参考型和任务型

从工程角度，Skill 内容分为两类：参考型和任务型。参考型 Skill 影响“怎么做”，任务型 Skill 决定“做什么”

在写 description 时需要明确它属于哪种类型：

![](./imgs/img63.png)



参考型 skill 自动选择是否使用

```yaml
---
name: api-conventions
description: API设计模式，适用于此代码库。在编写或审查API端点时使用。
---
```




任务型 skill 通常由用户手动触发

```yaml
---
name: deploy
description: 部署应用程序到生产
disable-model-invocation: true
---
```




参考型 Skill 更像组织的行为规范层。它定义例如 API 设计标准、代码风格、错误处理约定。这类 Skill 通常由模型根据语义自动判断是否加载，不主导行动，而是塑造行动的方式

任务型 Skill 则更像组织的操作流程层。它定义一次明确的行动：部署、发布、迁移、生成报告等。这类行为具有边界和风险，通常需要显式触发，因此常配合 disable-model-invocation 使用




### Skill 文件结构

> 完整示例在：03-Skill/01-reference-skill




在Claude Code中，每个 Skill 独占一个目录。其标准的目录和文件结构如下：`.claude/Skill/<skill-name>/SKILL.md`


```yaml
.claude/Skill/api-conventions/     # skill 目录，名称即 skill 名
└── SKILL.md                        # 主文件（必需）
```

配置：

````markdown
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

Skill 主要有三个部分：

- YAML frontmatter，是通过`---`包裹的元数据
- Markdown 正文，是技能的具体说明
- 辅助文件：`.claude/Skill/<skill-name>/SKILL.md`。每个 Skill 在自己的目录中，可以包含辅助文件（当前 skill 暂时没有）



这是一个典型的参考型 Skill：

- 没有执行步骤 ：不是先做A再做B，而是“遵循这些规范”
- 没有输出模板 ：不要求 Claude 输出固定格式的报告
- 没有设 disable-model-invocation：Claude 可以自动判断何时需要
- 只读工具 ：allowed-tools 限制为 Read/Grep/Glob，因为规范查阅不需要改代码



Claude 选择是否激活一个 Skill，完全依赖于阅读 description。这不是关键词匹配，而是语义理解。**description 是 Skill 的灵魂，因为它不是给人看的文档，而是给 Claude 看的触发器**




**好的 description 与差的对比**

```yaml
description: 处理PDF文件

很明显，问题在于太模糊，“handles”是什么意思？读取？转换？合并？Claude 不知道什么时候该用它。用户说“帮我处理这个 PDF”时，Claude 可能不确定这个 Skill 是否合适。



description: 从PDF文件中提取文本和表格，填写表格，合并文档。当处理PDF文件或用户提及PDF、表格或文档提取时使用。

为什么这版更好？因为它列出了具体动作（extract, fill, merge）；包含了用户可能说的关键词（PDF, forms, document extraction）；明确说明了触发场景（“Use when…”）
```




description 书写公式：**description = [做什么] + [怎么做] + [什么时候用]**

几个套用公式的示例：

```markdown
# 代码审查 Skill
description: 审查代码的质量、安全性和最佳实践。检查错误、性能问题和风格违规。当用户请求代码审查、希望获得代码反馈、提及审查更改或询问代码质量时使用。


# API 文档 Skill
description: 从代码生成API文档。提取端点、参数和响应模式。当用户想要记录API、创建API参考、生成端点文档或需要帮助处理OpenAPI/Swagger规范时使用。

# 数据库查询 Skill
description: 查询数据库并分析结果。支持SQL生成、查询优化和结果解释。当用户询问数据、想要运行查询、需要数据库信息或提及表/模式时使用。
```




有多个 Skill 时，确保 description 有明确区分：

```markdown
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



### Skill Frontmatter 字段详解

Claude Code Skill 支持的完整 frontmatter 字段如下：

```yaml
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

- name 字段：最大 64 字符，只能使用小写字母、数字、连字符，推荐使用动名词形式：code-reviewing、api-documenting、bug-fixing。如果省略了这个字段，则自动使用目录名（.claude/Skill/code-reviewing/ → name 为 code-reviewing）

- description 字段：这是最重要的字段。它决定 Skill 何时被触发。这个字段应该包含两部分信息：这个 Skill 做什么，以及什么情况下使用它。如果省略了这个字段，系统会使用 Markdown 正文的第一段作为 description
  > 注意：所有 Skill 的 description 会被加载到上下文中供 Claude 判断选择，默认总预算为 15,000 字符。如果你的 Skill 很多，导致 description 被截断，可以运行 /context 查看警告，并通过环境变量 SLASH_COMMAND_TOOL_CHAR_BUDGET 调大预算

- argument-hint 字段：自动补全提示，为用户提供参数格式提示，在输入 /skill-name 时系统会自动补全

- disable-model-invocation 和 user-invocable 这两个字段组合起来控制“谁能触发这个 Skill”

  ![](./imgs/img64.png)

  > 凡是带副作用的Skil，也就是有系统性影响的 Skill：比如部署、发消息、改配置，一定要设 disoble-model-invocation：true

- allowed-tools 字段用来限制 Skill 被激活时 Claude 能使用的工具。Skill 支持的工具包括：

  ![](./imgs/img65.png)
  
  还可以更精细地控制 Bash 命令：
  ```yaml
  allowed-tools:
    - Bash(git:*)      # 只能执行 git 命令
    - Bash(npm test:*) # 只能执行 npm test 相关命令
  ```
  
- context、agent、model：Skill 的执行环境

  ![](./imgs/img66.png)
  
- hooks：Skill 级别的 Hooks，可以为 Skill 定义仅在其生命周期内生效的 Hooks




### 总结

Skill 重点：

- **Skill 是可由用户或 Claude 触发的能力包**，Claude 通过语义推理决定何时激活，但目前已经脱离了 Claude Code本身，形成了 Agent 通用技能生态。
- **Skill 的 description 不是文档，而是触发器**，其构建公式为：做什么 + 怎么做 + 什么时候用
- **Claude Code 采用渐进式加载**来节省 token。description 常驻上下文，全文仅在触发时加载




什么时候用参考型 Skill，什么时候用任务型 Skill？什么时候必须手动触发？

![](./imgs/img67.png)

简而言之，CLAUDE.md 放`Claude 每次都该知道的少量规则（< 100 行）`；Skill 放`特定场景下的详细指令和知识”（可以很长，按需加载）`。**如果犹豫放 CLAUDE.md 还是 Skill，那么就放 Skill，并在 CLAUDE.md 里加一行引用**。



## 任务型 Skill

早期，斜杠命令 `/Comands` 和 Skill 是两个独立组件。但在新版 Claude Code 中，Commands 已合并到 Skill，成为 Skill 的子集

`/command` 整合进入 Skill 后，任务型 Skill 基本等同于 `/command`



在 Claude Code 里，令行禁止几乎可以直接翻译为：`disable-model-invocation: true` 。也就是说，没有用户触发，Claude 绝不主动执行



任务型 Skill 的价值：**把重复的对话模式，变成可复用的快捷方式**



### 任务型 Skill 的核心机制

简单来说，任务型 Skill 就是设了 `disable-model-invocation: true` 的 Skill



```yaml
# 参考型——Claude 自动选择是否使用，也可手动触发
name: api-conventions
description: API design patterns for this codebase. Use when writing or reviewing API endpoints.


# 任务型——必须用户手动触发
name: deploy
description: Deploy the application to production
disable-model-invocation: true
```



Claude Code 有两种类型的命令。**内置命令** 是 Claude Code 自带的，用于控制会话和工具，无法修改。 **自定义命令** 是创建的任务型 Skill，用于执行特定的工作流程，完全可掌控



任务型 Skill 可以放在两个目录下：

```yaml
.claude/skills/<name>/SKILL.md      # 推荐：Skills 目录（完整能力）
.claude/commands/<name>.md           # 兼容：Commands 目录（简单命令）
```

两个的区别：

![](./imgs/img68.png)



### 通过 ARGUMENTS 给 Skill 传参

当通过 `/skill-name args` 调用 Skill 时，`args` 会通过 `$ARGUMENTS` 注入到 Skill 内容中



例子，有 `fix-issue` 这个 skill，如下：

```markdown
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.

1. Read the issue description
2. Understand the requirements
3. Implement the fix
4. Write tests
5. Create a commit
```

当运行 `/fix-issue 123` 时，Claude 收到的内容是“Fix GitHub issue **123** following our coding standards…”

> 注意，传参并不仅仅限于任务型Skill



Skill 支持两种**参数传递** 方式：

- **单参数** ——`$ARGUMENTS` 接收所有参数

  ```markdown
  ---
  description: Quick git commit
  argument-hint: [commit message]
  disable-model-invocation: true
  ---
  
  Create a git commit with message: $ARGUMENTS
  
  ```

- **多参数** —— `$1`，`$2` 接收位置参数

  ```markdown
  ---
  description: Create a pull request
  argument-hint: [title] [description]
  disable-model-invocation: true
  ---
  
  Title: $1
  Description: $2
  ```

  用法示例：

  ```bash
  /commit fix login bug           # $ARGUMENTS = "fix login bug"
  /pr-create "Add auth" "JWT"     # $1 = "Add auth", $2 = "JWT"
  ```

  可以用 `$ARGUMENTS[N]` 或简写 `$N` 访问特定位置的参数

  ```markdown
  ---
  name: migrate-component
  description: Migrate a component from one framework to another
  ---
  
  Migrate the $0 component from $1 to $2.
  Preserve all existing behavior and tests.
  ```

  上面，执行 `/migrate-component SearchBar React Vue`，`$0` 被替换 为SearchBar, `$1` 为 React, `$2` 为Vue



> 如果 Skill 中根本就没有定义 `$ARGUMENTS`，而在调用Skill的时候又偏偏传递了参数进去。Claude Code 会自动在内容末尾追加 `ARGUMENTS: <用户输入>`，确保参数不会丢失



### `!command` 动态上下文注入

前置知识：Claude Code  中输入 `! + 命令`，相当于：**直接在当前终端环境执行一条 shell 命令**

```bash
!ls
!pwd
!git status
!npm test
!python main.py
```



Skill 中那么多文字和信息，其实归根结底还是 Prompt，需要 Claude Code（工具）发给 Claude 或者 GLM/Qwen 等模型来处理。而模型启动时并不知道和当前技能相关的上下文，这一功能刚好可以解决该问题



当用户输入 `/pr-create "Add auth"` 时，模型收到的只是 Prompt 文本。它并不知道：

- 当前在哪个分支
- 有哪些 commit 待合并
- 改了哪些文件



如果不预注入上下文，其实模型也会**先花多轮工具调用** 去收集这些信息，任务虽然还是能完成，但浪费 token 和时间。

而 `!command` 是 Skill 文件的**预处理器** ——在文件内容发送给模型 **之前** ，先在 shell 中执行这些预设的命令，然后**把它们的输出结果内联替换到 Prompt 中** ，再去执行新的命令。



示例：

```markdown
## Current Context (Auto-detected)

Current branch:
!`git branch --show-current`

Recent commits on this branch:
!`git log origin/main..HEAD --oneline 2>/dev/null || echo "No commits ahead of main"`

Files changed:
!`git diff --stat origin/main 2>/dev/null || git diff --stat HEAD~3`
```



Claude 实际收到的 Prompt（替换后）：

```markdown
## Current Context (Auto-detected)

Current branch:
feature/auth

Recent commits on this branch:
a1b2c3d Add JWT middleware
d4e5f6g Add login endpoint
g7h8i9j Add user model

Files changed:
 src/auth/middleware.ts | 45 +++
 src/auth/login.ts     | 82 +++
 src/models/user.ts    | 34 +++
 3 files changed, 161 insertions(+)
```

这样，Claude **启动**`/pr-create "Add auth"` **时就拥有了完整上下文** ，可以直接生成 PR 标题和描述，无需额外再进行多一次工具调用



执行流程如下：

![](./imgs/img69.png)



`!command` 可以与 `$ARGUMENTS` 组合，在动态注入时使用参数值

```markdown
---
description: Show git blame for a file
argument-hint: [file path]
disable-model-invocation: true
allowed-tools: Bash(git:*)
---

Analyze the git history for: $ARGUMENTS

File blame:
!`git blame $ARGUMENTS 2>/dev/null | head -30 || echo "File not found"`

Recent changes:
!`git log --oneline -5 -- $ARGUMENTS 2>/dev/null || echo "No history"`
```

`$ARGUMENTS` 参数会先被替换，再执行 `!command`。这意味着用户输入会进入 shell 命令。因此**务必在** `allowed-tools`**中严格限制可执行范围**



动态注入的工程价值和优势：

![](./imgs/img70.png)



### Skill 内的 Hooks

任务型 Skill 通常执行的是有**副作用(side-effect）** 的操作：提交代码、部署应用、修改文件。这类操作需要自动化的安全网



Hooks 配置很简单，只需要在 frontmatter 的 `hooks` 字段中定义：

```markdown
---
description: Safe deployment command
disable-model-invocation: true
allowed-tools: Bash(git:*), Bash(npm:*), Bash(ssh:*)
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: "command"           
          command: echo "About to run: $TOOL_INPUT" >> /tmp/deploy.log
  PostToolUse:
    - matcher: Edit
      hooks:
        - type: "command"           
          command: npx prettier --write "$FILE_PATH"
---

Deploy the application to staging environment.
```

Skill 内的 Hooks 不是一条一条平铺写的，而是按**事件 → 匹配规则 → 要执行的命令列表**一层一层包起来。也就是一个三层树形结构，而不是一行一个 Hook。这是为了支持**多事件 × 多工具 × 多动作** 的组合扩展



Skill 中常用 Hook 模式如下：

![](./imgs/img71.png)

- PreToolUse：工具执行前触发
- PostToolUse：工具成功执行后触发
- Stop：Claude 正常完成一轮回复时触发

还有其他的 Hook 执行时机，但上面三个最常用



Skill Hooks与全局 Hooks 的区别如下：

![](./imgs/img72.png)



### 任务型 Skill 设计方法论

设计一个 Skill 时，可以按照七步清单：

1. 动作是什么？ → 命名（commit、deplo，y、review）
2. 谁能触发？   → disable-model-invocation: true
3. 需要什么权限？→ allowed-tools 精确到命令级
4. 启动时需要什么上下文？→ `!command` 预注入
5. 执行过程需要什么安全网？→ hooks
6. 输出量大不大？→ 大则 context: fork
7. 用什么模型？ → model（简单 haiku，复杂 sonnet）



任务型 Skill的几个重要设计原则：

- **单一职责原则** ：一个命令做一件事

  ```yaml
  ✅ /commit, /push, /review
  ❌ /git-all-in-one
  ```

- **清晰命名原则** ：从命令名就能知道它做什么

  ```yaml
  ✅ /test:unit, /deploy:staging, /pr-create
  ❌ /do-stuff, /cmd1, /x
  ```

- **有意义的参数提示** ：让使用者了解如何传参

  ```yaml
  ✅ argument-hint: [commit message]
  ✅ argument-hint: [source file] [target directory]
  ❌ argument-hint: [args]
  ```

- **权限最小化原则** ：严格控制每个任务的权限边界

  ```yaml
  # ✅ 精确授权——只允许 git 的特定子命令
  allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git commit:*)
  
  # ❌ 过于宽泛——等于授权所有 shell 命令
  allowed-tools: Bash(*)
  ```



权限范围的设计经验：

![](./imgs/img73.png)



### 实战：团队标准命令集

> 实战项目在：03-Skills/02-team-standards

可以在 `.claude/commands` 下，也可以在 `.claude/skills` 下，同名 skill 在 skills 下的优先级高。更加推荐直接放在 skills 下



### 总结

- **任务型 Skill =**`disable-model-invocation: true`。这个字段决定了 Skill 是“知识提供者”还是“动作执行者"。任务型绝不让 Claude 自作主张触发

- `!command` **动态上下文注入**。让 Claude 启动时就拥有完整上下文，减少 3-5 次工具调用，提升响应一致性

- **Skill 内 Hooks 提供执行期间的安全网** ，仅在 Skill 生命周期内生效，随 Skill 一起分发

- **七步设计清单** ：动作 → 触发 → 权限 → 上下文 → 安全网 → 隔离 → 模型。尤其要强调的原则是**权限最小化原则，**`allowed-tools` 应该精确到命令级，不要随便用 `Bash(*)`
- **Skill 的价值在于积累**。团队标准化流程就是把最佳实践固化为 Skill



## 渐进式披露架构设计

在真实场景中，专业能力往往很复杂，比如一个财务分析 Skill，它需要包含财务指标计算公式、不同行业的基准数据、各种报表模板、分析脚本以及案例示例

如果把这些全部塞进一个 SKILL.md，会有两个问题：

- **Token 爆炸**：每次激活都要加载几千 tokens

- **信息噪声**：用户问“收入增长率怎么算”，Claude 却要阅读关于成本分析、现金流、资产负债表的全部内容



**渐进式披露（Progressive Disclosure** ，即渐进式的加载**）** 就是解决这个问题的架构模式。但渐进式披露的意义远不止节省 token。从企业本体论的视角看，它是**知识管理（Knowledge Management）在 AI 架构中的技术映射**。如何让正确的知识在正确的时刻到达正确的执行者手中



### 渐进式披露的设计哲学

用图书馆来类比渐进式披露的设计哲学：走进一个图书馆找资料时，不会一次把所有书都读一遍。而是先看目录找到相关分类，再选一本具体的书，最后翻到需要的章节深入阅读。信息是逐层展开的，而不是一次性全部载入大脑



Skill 的渐进式披露设计也是一样：

- 第一层只扫描 description 作为“目录”
- 第二层在触发时加载 SKILL.md 主文件作为“章节”，
- 第三层再按需加载被引用的具体文件作为“附录”。

结构化分层替代信息堆叠，让系统在规模变大时依然高效、可控

![](./imgs/img74.png)



### 上下文窗口是稀缺资源

**上下文窗口是 LLM 的“工作记忆”。** 人类的工作记忆大约能同时处理 7±2 个信息块（Miller’s Law）。LLM 的上下文窗口虽然大得多（最新的到 1M），但也是**有限的稀缺资源** ，而且有一个更严重的问题：**注意力稀释效应**



注意力稀释效应：是指上下文越长，LLM 对每个信息片段的关注度越低。一个 5000 token 的上下文中的关鍵指令，比一个 50000 token 上下文中的同样指令，会被更准确地执行。



**渐进式披露的本质**：以最小的 token 投入获得最高的任务完成质量——这就是知识的**投资回报率（Knowledge ROI）**

![](./imgs/img75.png)



### Skill 的三层渐进式架构详解

例子：财务分析 Skill。当用户提出与收入、成本、利润、增长率、毛利率、ROE/ROA 或整体财务表现相关的问题时，会被激活，先在主文件中完成问题识别和分析路径判断，再按需加载对应的公式说明、行业基准数据或报告模板，必要时调用脚本进行确定性计算，最后输出结构清晰、口径一致的分析结果



Skill 的三层渐进式的架构设计：

**层级 1：目录页（Entry Point）**

这是 Skills 系统扫描阶段读取的内容——**只有 description**

```yaml
---
name: financial-analyzing
description: Analyze financial data, calculate ratios, and generate reports. Use when the user asks about revenue, costs, profits, margins, financial metrics, or needs financial analysis.
---
```

目录页的设计原则是，description 足够丰富，让 Claude 能准确判断相关性。但不要太长，因为**所有 Skill 的 description 共享 15,000 字符的总预算** 。如果 Skill 数量多导致 description 被截断，可以通过 `SLASH_COMMAND_TOOL_CHAR_BUDGET` 环境变量调整



> ！注意：
>
> description 的预算机制决定了一个项目不应有过多的 Skill。如果一个项目需要 20+个 Skil，应该考虑是否有些可以合井，或者用子目录分层
>
> description 是一种 token 投资。每多一个字符的 description，就多占一个字符的常驻上下文



**层级 2：章节（Main Content）**

章节指的是 SKILL.md 的正文部分——**激活后才加载** 

```markdown
# Financial Analysis Skill

## Quick Start
基础的财务分析流程...

## Available Analyses

### Revenue Analysis
For detailed formulas, see `reference/revenue.md`

### Cost Analysis
For detailed formulas, see `reference/costs.md`

### Profitability Analysis
For detailed formulas, see `reference/profitability.md`

## When to Load Additional Resources
- 需要具体公式 → 加载对应的 reference/*.md
- 需要行业基准 → 加载 data/benchmarks.json
- 需要报告模板 → 加载 templates/*.md
```

这一部分的设计原则是主文件提供“路线图”，通过文件引用指向详细内容，然后Claude 根据用户请求决定加载哪些具体内容



**层级 3：附录（On-Demand Resources）**

只有当 SKILL.md 中引用了这些文件，Claude 才会去读取这一类文件

```yaml
.claude/skills/financial-analyzing/    # 标准 Skill 目录
├── SKILL.md                           # 主文件（总是加载）
├── reference/                         # 参考资料
│   ├── revenue.md                     # 收入分析公式
│   ├── costs.md                       # 成本分析公式
│   └── profitability.md               # 盈利分析公式
├── templates/                         # 报告模板
│   ├── quarterly_report.md
│   └── annual_report.md
├── data/                              # 数据文件
│   └── industry_benchmarks.json
└── scripts/                           # 分析脚本
    ├── calculate_ratios.py
    └── generate_report.sh
```

这一部分内容的设计原则是文件名要有描述性（`revenue.md` 而非 `ref1.md`）。Claude 根据文件名判断是否需要加载

所有辅助文件都在 Skill 自己的目录内，随 Skill 一起分发。相关内容放在一起，并按功能域组织子目录。例如脚本有自己独立存放的目录（scripts），Claude 可以执行它，但不需要去“理解”（这样也就节省了Token）



### 财务分析 Skill：项目设计细节

财务分析 Skill 结构如下：

> 在 03-Skills/03-financial-skill 下

```yaml
.claude/skills/financial-analyzing/
├── reference/
│   ├── revenue.md                   # 收入分析
│   ├── costs.md                     # 成本分析
│   └── profitability.md             # 盈利分析
├── templates/
│   └── analysis_report.md           # 分析报告模板
├── scripts/
│   └── calculate_ratios.py          # 比率计算脚本
└── SKILL.md                         # 主 Skill 文件
```



主文件 SKILL.md 设计如下：

````markdown
---
name: financial-analyzing
description: Analyze financial data, calculate financial ratios, and generate analysis reports. Use when the user asks about revenue, costs, profits, margins, ROI, financial metrics, or needs financial analysis of a company or project.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(python:*)
---

# Financial Analysis Skill

You are a financial analyst. Help users analyze financial data, calculate key metrics, and generate insightful reports.

## Quick Reference

| Analysis Type | When to Use | Reference |
|--------------|-------------|-----------|
| Revenue Analysis | 收入、营收、销售额相关 | `reference/revenue.md` |
| Cost Analysis | 成本、费用、支出相关 | `reference/costs.md` |
| Profitability | 利润、毛利率、净利率相关 | `reference/profitability.md` |

## Analysis Process

### Step 1: Understand the Question
- What financial aspect is the user asking about?
- What data do they have available?
- What format do they need the answer in?

### Step 2: Gather Data
- Request necessary financial data from user
- Or read from provided files/sources

### Step 3: Calculate Metrics
For specific formulas and calculations:
- Revenue metrics → see `reference/revenue.md`
- Cost metrics → see `reference/costs.md`
- Profitability metrics → see `reference/profitability.md`

To run calculations programmatically:
```bash
python scripts/calculate_ratios.py <data_file>
```

### Step 4: Generate Report
Use the template in `templates/analysis_report.md` for structured output.

## Output Guidelines

1. Always show your calculations
2. Explain what each metric means
3. Provide context (industry benchmarks when available)
4. Give actionable recommendations

## Important Notes

- Never make up financial data
- Ask for clarification if data is incomplete
- Flag any unusual numbers that might be errors
````



这个 Skill 包括一个 Quick Reference 表格，让 Claude 快速定位需要哪个参考文件。使用相对路径指向资源，进行清晰的文件引用，并通过脚本调用说明告诉 Claude 如何使用计算脚本。同时只允许 Read、Grep、Glob 和特定的 Bash 命令



上面的 SKILL.md 设计，本质上是一个**路由器**，根据用户请求的类型，将 Claude 导向不同的资源文件：

```yaml
用户请求 → SKILL.md（路由判断）  →  目标资源
                │
                ├─ "收入相关"  →  reference/revenue.md
                ├─ "成本相关"  →  reference/costs.md
                ├─ "利润相关"  →  reference/profitability.md
                ├─ "要报告"    →  templates/analysis_report.md
                └─ "要计算"    →  scripts/calculate_ratios.
```

这个路由的**关键设计技巧** 是 Quick Reference 表格。用最少的 token（3 行表格 ≈ 50 tokens）告诉 Claude 五个方向的路由。如果没有这个表格，Claude 需要阅读整个 SKILL.md 的 Step 3 才能知道“收入问题去找 revenue.md”。这就是**信息密度** 的差异



好的路由表格应该：

- 用“用户可能说的关键词”作为路由条件（而非“文件内容的技术名称”）
- 每个路由条目一行，不要超过 10 个条目（超过就需要分层）
- 高频路由放前面



上面的财务分析 skill，具体例子的执行过程：

```yaml
问题一：毛利率怎么计算？

1.扫描 Skills → 发现 financial-analyzing 匹配
2.加载 SKILL.md → 看到 “Profitability → see reference/profitability.md”
3.加载 reference/profitability.md → 找到毛利率公式
4.回答用户





问题二：帮我分析 data 目录中的财务数据，生成一份完整的分析报告，放到当前目录跟目录下

Claude 加载过程：

1. 扫描 Skills，发现 financial-analyzing 匹配
2. 加载 SKILL.md
3. 分析任务需要，加载所有 reference/*.md
4. 需要报告格式，加载 templates/analysis_report.md
5. 需要计算 ，执行 scripts/calculate_ratios.py
```

场景对比：

![](./imgs/img76.png)

渐进式披露的价值：大部分请求只需要部分资源，平均节省 50-80% tokens



### 渐进式的设计模式与最佳实践

#### 文件组织模式

首先是**文件组织模式** ，有两种模式：

- 按功能分类
- 按使用频率分类

如果 Skill 有多种类型的资源（知识+模板+脚本），用功能分类；如果只有不同深度的知识文档，用频率分类



按功能分类（更推荐）：

```yaml
.claude/skills/my-skill/
├── SKILL.md           # 入口 + 路由（< 500 行）
├── reference/         # 知识库（公式、规范、基准）
├── templates/         # 输出模板（报告、代码骨架）
├── examples/          # 示例集（输入输出样本）
├── scripts/           # 可执行脚本（计算、生成、验证）
└── data/              # 静态数据（JSON、CSV
```



按使用频率分类（适合知识型 Skill）：

```yaml
.claude/skills/my-skill/
├── SKILL.md           # 核心内容（高频，总是加载）
├── QUICKREF.md        # 快速参考（高频，常被加载）
├── DETAILED.md        # 详细说明（中频，按需加载）
└── ADVANCED.md        # 高级用法（低频，很少加载）
```



#### 主文件设计原则

然后是**主文件设计原则** 。主文件应该控制在 **500 行以内**（官方建议：Keep SKILL.md under 500 lines. Move detailed reference material to separate files.）

应该提供路线图，用 Quick Reference 表格做个快速路由，而非让 Claude 逐行扫描



什么内容放主文件，什么内容放引用文件？答案是**高频内容内联，低频内容外链。** 最常用的信息直接放在主文件（80/20 法则——80% 请求只需 20% 内容）；偶尔用到的详细信息放在引用文件，用**契约式引用**



什么是**契约式引用**？

SKILL.md 引用辅助文件时，不要只写一个路径，要写一个**契约** ，让 Claude 知道什么时候该加载、加载后能得到什么

```markdown
# ❌ 弱引用（Claude 不知道何时该加载）
See `reference/revenue.md` for more details.



# ✅ 契约式引用（Claude 清楚加载条件和预期内容）
## Revenue Analysis
When the user asks about revenue growth, ARPU, or revenue composition:
→ Load `reference/revenue.md` for calculation formulas and industry benchmarks
```



契约式引用三要素包括：

- **触发条件** ：什么情况下应该加载（“当用户问到 X 时”）

- **文件路径** ：去哪里找

- **内容预期** ：加载后能得到什么（“计算公式和行业基准”）



引用文件命名要清晰，切忌模糊，重复

```markdown
# 好的命名
reference/revenue.md           # 清晰表明内容
reference/profitability.md     # 清晰表明内容
templates/quarterly_report.md  # 清晰表明用途


# 差的命名
reference/ref1.md              # 不知道是什么
docs/misc.md                   # 太模糊
file.md                        # 毫无信息
```



#### 脚本

脚本适合封装**复杂但确定性的逻辑** 。脚本的好处是 Claude Code可以直接执行它，而不需要“理解”"每一行代码，因此可以减少 Token 消耗（不需要把逻辑放在 prompt 中），便于测试和维护（独立的代码文件）

```markdown
# 适合脚本
- 财务比率计算（公式固定）
- 数据格式转换（规则明确）
- 文件批量处理（重复性高）


# 不适合脚本
- 开放性分析（需要判断）
- 创意性任务（需要灵活性）
- 交互式决策（需要反馈）
```



脚本不仅能做计算，还能**生成可视化结果** 。Claude 官方提供了一种强大的模式：Skill 中的脚本生成交互式 HTML 文件，在浏览器中打开



代码库可视化 Skill 的示例：

```yaml
.claude/skills/codebase-visualizer/
├── SKILL.md                    # 指令：调用 visualize.py
└── scripts/
    └── visualize.py            # 生成交互式目录树 HTML
```



SKILL.md 只需要告诉 Claude 运行脚本：

```markdown
---
name: codebase-visualizer
description: Generate an interactive tree visualization of your codebase. Use when exploring a new repo or understanding project structure.
allowed-tools: Bash(python *)
---

Run the visualization script from your project root:

\```bash
python ~/.claude/skills/codebase-visualizer/scripts/visualize.py .
\```

This creates `codebase-map.html` and opens it in your default browser.
```



流程：用户请求 → Skill 激活 → Claude 执行脚本 → 生成 HTML → 浏览器打开

**这体现了渐进式披露的极致。Claude 只需要知道“运行什么命令”（10 tokens），而非“如何生成 HTML”（2000+ tokens）**



### 内容拆分工程方法论

一个根本问题：面对一坨知识，怎么决定什么放 SKILL.md、什么放引用文件、什么放脚本？



知识拆分决策树：

![](./imgs/img77.png)

这棵决策树背后真正体现的，是：**核心语义内联，确定逻辑外包，结构独立，数据延迟，示例分离** 等大原则



官方建议 SKILL.md 控制在 **500 行以内**，超过 500 行时的重构信号和对策如下：

![](./imgs/img78.png)



拆分决策树和目录结构不是随意设计的。它们映射到**企业知识管理的经典范式**：

![](./imgs/img79.png)

1. **SKILL.md = 部门 SOP 首页** 。好的 SOP 首页不会把所有操作细节都列出来。它提供概览和导航，让使用者快速找到需要的章节。SKILL.md 的 Quick Reference 表格就是这个导航
2. **reference/ = 知识库** 。企业知识库的特点是内容丰富但使用频率低，按需查阅而非每次通读。Skill 的 reference 文件同理。只有 Claude 判断需要时才加载
3. **templates/ = 标准化输出** 。企业用模板确保报告、邮件、文档的格式一致。Skill 的模板同理。Claude 不需要每次都“创造”一个报告格式
4. **scripts/ = 自动化工具** 。企业用脚本和工具自动化重复性操作。这里的关键洞察是，**脚本把“知识”变成了“行动“** 。它是 Skills（知识层）和 Tools（行动层）的桥梁



这引出了一个重要话题：Skills 和 Tools 到底是什么关系？它们如何协作？下面继续探讨



### Skills 与 Tools 的本质关系

#### 第一层关系：Skills 约束 Tools

Skills 通过 allowed-tools 约束 Tools **，**实现 **最小权限原则**

```yaml
allowed-tools:
  - Read          # 允许读取
  - Grep          # 允许搜索
  - Glob          # 允许查找
  # 没有 Write、Edit、Bash → 不允许修改
```

这不是简单的权限控制。这是**知识约束行动** 的范式。一个代码审查 Skill “知道”审查只需要看代码不需要改代码，所以它只给 Claude 只读工具。一个文档生成 Skill “知道”需要创建新文件但不应修改旧文件，所以它给 Write 但不给 Edit。



#### 第二层关系：Skills 编排 Tools

Skill 中的 `scripts/` 目录存放的脚本，本质上是**预编译的 Tool 调用序列**

```markdown
# scripts/calculate_ratios.py
# 这个脚本 = Read(data_file) + 计算逻辑 + Print(results)
# Claude 不需要理解计算逻辑，只需要：
#   1. Bash("python scripts/calculate_ratios.py data.json")
#   2. 读取输出结果
```



没有脚本时，Claude 需要自己组合多个 Tool 调用来完成任务：

手动编排（没有脚本）：
1. Read(data.json) → 获取数据
2. Claude 内部计算 → 消耗推理 token
3. 可能出错 → 需要多轮修正



有脚本时，Claude 只需一次 Tool 调用：

脚本编排（有脚本）：
1. Bash(python calculate.py data.json) → 直接获得结果



**脚本是“预编译”的知识**。它把人类专家的领域逻辑固化为代码，让 Claude 不需要在运行时“重新发明轮子”。



#### 第三层关系：Tools 反哺 Skills

`!command` 语法展示了反向关系：**Tools 的输出反哺 Skills 的上下文**

```markdown
---
name: pr-summary
description: Summarize changes in a pull request
---

## Context
- PR diff: !`gh pr diff`           # Tool 输出 → 注入 Skill 上下文
- Changed files: !`git diff --name-only`
```

这是 Tools 反哺 Skills 的预处理模式：Shell 命令在 Skill 加载之前执行，输出直接注入 SKILL.md 内容，Claude 收到的是**已经包含实时数据的知识**



####  Skills × Tools 共生公式

上述三层关系做个总结可以得到下面的 Skills × Tools 共生公式：

![](./imgs/img80.png)



### 总结

**渐进式披露**是 Skills 的核心架构模式：按需加载，节省 tokens



**三层架构是**：目录页（description）→ 章节（SKILL.md）→ 附录（引用文件）



**SKILL.md 是路由器，**通过Quick Reference 表格用最少 token 完成路由判断。引用文件的“契约式”写法，即**契约式引用会**告诉 Claude 何时加载、加载什么、得到什么。这里有一个 **500 行法则** ，超过就该重构。把参考、模板、示例移到辅助文件。通过**脚本**来封装确定性逻辑，Claude 执行但不需要理解脚本中的内容



如果与之前的子代理一起，那么有两种上下文管理策略，分别是**Skill的渐进式披露（按需加载）+ 子代理隔离（纯净上下文）**它们互相补充，解决不同的问题。两种上下文管理策略表的对比：

![](./imgs/img81.png)

**组合使用** ：一个子代理可以通过 `skills` 字段预加载 Skill，而该 Skill 内部仍然用渐进式披露组织内容。两种策略是互补的

















