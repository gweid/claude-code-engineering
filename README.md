# claude code 实践笔记

Claude Code 是 Anthropic 官方推出的一个基于命令行的 AI 编程助手，它不是简单是 AI 问答平台，而是一个完整的 AI 工程体系。




知识点汇总：

- [Claude Code 基础](./01-基础.md)
  - [claude code 的核心点](./01-基础.md#claude-code-的核心点)
  - [claude code 的底层技术全景](./01-基础.md#claude-code-的底层技术全景)
  - [claude code 记忆系统基本原理](./01-基础.md#claude-code-记忆系统基本原理)

- [Claude Code 子代理](./02-子代理.md)
  - [SubAgents子代理](./02-子代理.md#subagents子代理)
  - [Multi-Agent 工程](./02-子代理.md#Multi-Agent-工程)
  - [构建只读型子代理](./02-子代理.md#构建只读型子代理)
  - [高噪音任务处理](./02-子代理.md#高噪音任务处理)
  - [并行探索和流水线编排](./02-子代理.md#并行探索和流水线编排)
  - [Agent Teams多会话协作架构](./02-子代理.md#Agent-Teams多会话协作架构)

- [Claude Code Skills 技能](./03-Skill技能.md)
  - [SKILL.md 结构与触发机制](./03-Skill技能.md#SKILL.md-结构与触发机制)
  - [任务型 Skill](./03-Skill技能.md#任务型-Skill)
  - [渐进式披露架构设计](./03-Skill技能.md#渐进式披露架构设计)
  - [Skill 与 SubAgent 的结合](./03-Skill技能.md#Skill-与-SubAgent-的结合)
  - [Skill 架构定位与高级能力](./03-Skill技能.md#Skill-架构定位与高级能力)
  - [构建生产级 Skill 体系](./03-Skill技能.md#构建生产级-Skill-体系)

- [Claude Code 核心机制和组件](./04-核心机制和组件.md)
  - [Hooks 事件驱动自动化](./04-核心机制和组件.md#Hooks-事件驱动自动化)
  - [Hooks 高级模式与工程实践](./04-核心机制和组件.md#Hooks-高级模式与工程实践)
  - [MCP 协议与外部工具连接](./04-核心机制和组件.md#MCP-协议与外部工具连接)
  - [Tools 工具系统内核剖析](./04-核心机制和组件.md#Tools-工具系统内核剖析)

- [Claude Code 工程化](./05-工程化.md)
  - [Headless 模式与 CI/CD 集成](./05-工程化.md#Headless-模式与-CI/CD-集成)
  - [Rules 规则系统深度剖析](./05-工程化.md#Rules-规则系统深度剖析)
  - [通过Agent SDK 掌控 Claude Code](./05-工程化.md#通过Agent-SDK-掌控-Claude-Code)
  - [Agent SDK 高级应用](./05-工程化.md#Agent-SDK-高级应用)
  - [Plugins 插件打包与分发](./05-工程化.md#Plugins-插件打包与分发)
