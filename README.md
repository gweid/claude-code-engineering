# claude code

Claude Code 是 Anthropic 官方推出的一个基于命令行的 AI 编程助手，它不是简单是 AI 问答平台，而是一个完整的 AI 工程体系。




## claude code 的核心点

核心点：

- Memory：解决 Agent 每次对话都“从零开始”、不理解项目背景的问题，让 AI 真正记住你的代码结构、约束和上下文。
- Sub-Agents：解决单一 Agent 角色混乱、上下文污染、又写代码又做审查的问题，通过职责拆分实现关注点分离。
- Skills：解决 Prompt 不可复用、经验无法沉淀、团队能力难以传承的问题，把个人技巧变成可组合的工程资产。
- MCP：MCP 协议 是 Claude Code 连接外部数据库、API 和服务的标准化协议，就像给 AI 装上了能无限扩展能力的“万能插座”。
- Hooks：解决 Agent 执行过程不可控、缺乏检查点、容易“越权操作”的问题，在关键节点引入自动校验和人工兜底。
- Headless：解决 Agent 只能在 IDE 里交互、无法进入自动化流程的问题，让 AI 能在 CI/CD 中无人值守地运行。
- Agent SDK：解决只会用对话的方式使用 Agent，难以嵌入现有系统和工作流的问题，用代码驱动 Agent，构建可编排的工程流程。




## claude code 的底层技术全景

![](./imgs/img1.png)


### 基础层：Memory（记忆系统）

风础层也可以称为是Claude Code的长期记忆系统，它的核心文件是 CLAUDE.md。记忆系统可以分几个层级：

```text
~/.claude/CLAUDE.md           # 全局（所有项目共用）
    ↓
项目根目录/CLAUDE.md           # 项目级（当前项目）
    ↓
项目根目录/.claude/rules/*.md  # 模块级（特定目录）
```

记忆系统相当于：比如入职一家新公司，第一天你会收到一份新员工手册，告诉你：公司的代码风格是什么，Git 提交信息怎么写，项目的架构是怎样的，有哪些不能碰的“禁区”等。




### 扩展层：四大核心组件

#### Commands（斜杠命令）

斜杠命令是 Claude Code 内置或用户自定义的一系列核心能力，其触发方式是用户手动输入: /command

```text
比如用户输入: /review
       ↓
Claude 执行: 根据 .claude/commands/review.md 的指令审查代码
Commands 适合标准化操作，比如：团队统一的 commit 格式、固定的部署流程等。
```




#### Skills（技能）

Skills 则代表着 AI 的一系列专属能力组合，其触发方式是 Claude Code 自动判断（语义推理）或者用户指定是否激活相应技能。Skills 可以是 Claude Code 内置的，也可以由用户自己设定。

```text
比如用户输入: 帮我看看这段代码有没有安全问题
       ↓
Claude 思考: 这是代码安全审查任务 → 激活 security-review Skill
       ↓
Claude 执行: 按照 Skill 中定义的流程审查代码
```



Skill 与 Tool 的区别：

- Tools 是外部能力接口，Skills是模型内部的“行为模式 + 触发逻辑”
- 如果 Tool 是函数调用，Skill 就是把 if-else、prompt、策略和调用顺序，全部折叠进一个文档的整体封装，是对一个专有能力集的全面定义
- 如果说 Tool 解决的是我能不能做，那么 Skill 解决的就是我该不该做、怎么做、做到什么程度




什么时候该用 Skill？什么时候该用 Commands？

- Commands 是显式、可复用、可审计、通过斜杠命令固定触发的操作指令集，是相对固化的标准流程
- 而当一个能力具备强烈的“领域感”（安全、架构、性能）、判断依赖上下文而非关键词 ，执行路径可能变化 ，需要“像专家一样行事”时，就用 Skill，而不是 Command

拿刚才的例子来说：当用户输入“帮我看看这段代码有没有安全问题”。Claude 的隐式判断流程是这样的：

1️⃣ 这是代码吗？ ——是
2️⃣ 这是哪一类代码？ ——Node.js 后端
3️⃣ 上下文是否涉及用户输入？ ——是
4️⃣ 是否存在鉴权逻辑？ ——是
5️⃣ 是否值得深入做安全审查？ ——是

做完这些判断之后，就会自动激活 security-review Skill。



在 Skill 内部，是“像专家一样”的行为说明，它不会跑固定 checklist，而是根据语言选择重点、根据上下文跳过无关项、在发现高风险点时主动深挖、在安全风险低时明确告诉你“为什么没问题” —— 这不是流程执行，这是专家判断



#### SubAgents（子代理）

SubAgents（子代理）用于独立完成专项任务。其触发方式可以由 Claude 决定或用户指定。

```text
主 Claude: 这个任务需要跑大量测试，让我创建一个子代理来处理
       ↓
子代理（test-runner）: 执行测试，只把结果汇报给主 Claude
```



SubAgents 本质上解决的是一个在 Agent 系统规模化之后必然出现的问题：单一Agent的上下文、 权限与职责无法无限膨胀

因此，把复杂任务拆解为多个拥有独立上下文、明确职责和受限权限的子代理， 已经成为多智能体系统中的一种工程共识。




#### Hooks（钩子）

钩子是在特定事件触发时自动执行的脚本，其触发方式是事件自动触发



```text
事件: Claude 即将执行 Edit 工具
       ↓
Hook: 自动检查是否有安全敏感内容
       ↓
结果: 如果发现问题，阻止执行并警告
```

Hooks 适合自动化检查: 如格式化、安全检查、日志记录等




### 集成层：连接外部世界

集成层，负责链接外部世界。包含 Headless（无头模式）和 MCP（Model Context Protocol）两大技术



####  Headless（无头模式）

无头模式让 Claude Code 在没有人工交互的情况下运行，适合 CI/CD 集成 ——自动代码审查、自动修复、自动生成变更日志等。




GitHub Actions 中
- name: Auto-fix code issues
  run: claude --headless "Fix all linting errors in src/"




#### MCP（Model Context Protocol）

MCP 让 Claude 连接外部工具和服务，可以把任何外部系统变成 Claude 可调用的工具

```
Claude → MCP → 数据库
Claude → MCP → Jira
Claude → MCP → 自定义 API
```




### 编程接口层：Agent SDK

当配置式的扩展不够用时，可以用代码来驱动 Claude。这种方式适合构建自定义 Agent，完全控制执行流程、自定义工具、复杂工作流。

```python
from claude_sdk import ClaudeSDKClient

client = ClaudeSDKClient()

# 执行任务
result = client.query(
    prompt="Review this code for security issues",
    tools=["Read", "Grep"],
    max_turns=10
)
```



## claude code 组件组合

在真实开发中，上面的 claude code 组件能力不是孤立存在的，它们相互协作，共同完成复杂任务



### 触发方式

首先看这些组件是怎么被激活的？不同的触发方式决定了它们的使用场景

![](./imgs/img2.png)



确定性很重要，要设计一个生产系统：

- 如果需要“每次都必须执行”的操作（比如代码格式化），你需要 100% 确定性  ——选择 Commands 或 Hooks
- 如果希望 Claude “智能判断何时使用”（比如识别到安全问题时自动深入分析），你可以接受概率性  ——选择 Skills
- 如果任务可能很重，你希望“既可以手动触发，也可以让 Claude 自己决定”，你需要可控性  ——选择 SubAgents




### 数据流向

数据是怎么在系统中流动的？一个典型请求的生命周期：

![](./imgs/img3.png)



比如当用户输入“帮我修复 src/api.js 中的安全漏洞”之后，Claude 可能的处理流程如下：

```
1. Memory 层：Claude 首先加载 CLAUDE.md，了解到这是一个 Node.js 项目，团队要求所有安全修复必须附带测试。

2. 扩展层分发：
  1. 用户没有输入斜杠命令，所以 Commands 不参与。
  2. Claude 识别出“安全漏洞”关键词，激活 security-review Skill。
  3. Skill 指示 Claude 创建一个子代理来执行测试。

Hooks 监控：Claude 准备执行 Edit 工具修改代码时，Hooks 自动运行预检查脚本，确保没有引入新的安全问题。

工具执行：通过 Read、Edit 等工具完成代码修改。

MCP 连接：如果配置了 Jira MCP，还可以自动更新相关的 ticket 状态。
```

Memory 是基础设施，始终存在；扩展层是能力中心，按需激活；Hooks 是守门人，监控一切。




### Plugins: 打包容器

当开发了一套好用的 Commands、Skills、Hooks 组合，想要分享给团队或社区时，就需要 Plugins。

Plugins 不是一种新能力，而是打包机制。就像 npm 包把一堆 JavaScript 文件打包在一起，Plugin 把一组相关的 Claude Code 扩展打包在一起。

```
my-plugin/
├── commands/           # 斜杠命令
│   └── review.md
├── skills/             # 技能
│   └── security-check/
│       └── SKILL.md
├── agents/             # 子代理
│   └── test-runner.md
├── hooks/              # 钩子
│   └── pre-edit.sh
└── plugin.json         # 插件配置
```



### claude 组件选型策略

可以参照下面决策：

![](./imgs/img4.png)

下面一些选型示例：

> 问题 1：我希望团队成员都用统一的 commit message 格式

- 这是一种“能力”吗？是的，是生成规范 commit message 的能力
- 希望手动触发还是自动识别？手动触发更合适，因为不是每次对话都需要 commit
- **答案**：适合用 Commands （创建一个 /commit 命令）



> 每当 Claude 要修改代码时，我想自动检查是否符合我们的安全规范

- 这是一种“能力“吗？不是，这是一种“检查机制”
- 需要在工具执行时自动检查？ 对，在 Edit 工具执行前检查
- **答案**：适合用 Hooks （创建一个 pre-Edit hook）



> 我想让 Claude 能够查询我们内部的知识库

- 这是一种“能力”吗？ 不完全是，这是“连接外部数据源”
- 需要连接外部系统？ 知识库是一个外部系统
- **答案**： 适合用 MCP （创建一个知识库 MCP server）



其他：

![](./imgs/img5.png)




### claude 组件组合

真实世界的问题很少能用单一技术解决。Claude Code 的强大之处在于组件可组合，每个组件做好自己的事，组合起来完成复杂任务。



假设想实现这样一个流程：每当有人提交 PR，自动进行代码审查，发现问题就评论，没问题就通过。这需要组合多种技术：

1. Headless 模式在 CI 中触发
   └── GitHub Actions 监听 PR 事件，调用 claude --headless

2. 调用 code-review SubAgent
   └── 隔离审查任务，避免污染主流程上下文

3. SubAgent 使用 security-check Skill
   └── 自动识别安全相关代码，应用专业审查规则

4. Hooks 记录审查日志
   └── 每次工具调用都记录，便于审计和调试

5. 结果通过 MCP 发送到 Slack
   └── 审查完成后通知相关人员

这五个步骤涉及五种不同的技术，但组合在一起就是一个完整的自动化流程

