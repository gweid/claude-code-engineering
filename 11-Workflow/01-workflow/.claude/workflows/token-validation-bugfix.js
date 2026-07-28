export const meta = {
  name: 'token-validation-bugfix',
  description: '定位、分析、修复并验证偶发的 token 验证失败问题',
  whenToUse: '用户登录后偶发 token 验证失败，且需要完整的定位到验证流水线时使用',
  phases: [
    { title: 'Locate', detail: '让 bug-locator 定位相关代码和调用链' },
    { title: 'Analyze', detail: '让 bug-analyzer 根据定位报告分析根因' },
    { title: 'Fix', detail: '让 bug-fixer 实施最小且安全的修复' },
    { title: 'Verify', detail: '让 bug-verifier 运行测试并检查回归' },
  ],
}

const bugDescription =
  typeof args === 'string'
    ? args
    : args && typeof args.bug === 'string'
      ? args.bug
      : '用户登录后偶尔会 token 验证失败'

phase('Locate')
const locationReport = await agent(
  `请调查以下 bug，并定位相关代码：

${bugDescription}

要求：
- 搜索登录、token 签发、解析、过期时间、时钟处理和验证调用链。
- 给出具体文件、函数和行号范围。
- 如果项目中不存在相关实现，请明确说明，不要猜测。
- 此阶段只定位，不分析修复方案，也不要修改文件。`,
  {
    label: 'bug-locator',
    phase: 'Locate',
    agentType: 'bug-locator',
  },
)

if (!locationReport) {
  return {
    status: 'stopped',
    stage: 'Locate',
    reason: 'bug-locator 未返回定位报告',
  }
}

phase('Analyze')
const analysisReport = await agent(
  `请基于 bug 描述和定位报告分析根因。

<bug-description>
${bugDescription}
</bug-description>

<location-report>
${locationReport}
</location-report>

要求：
- 重新读取定位到的代码并验证定位报告，不要把报告中的假设当成事实。
- 重点检查过期时间单位、时区/时钟偏差、并发刷新、旧 token 覆盖、密钥或算法不一致等可能导致“偶发失败”的条件。
- 明确根因、触发条件、影响范围、修复建议和回归风险。
- 如果没有足够代码或证据确认根因，请明确说明。
- 此阶段不要修改文件。`,
  {
    label: 'bug-analyzer',
    phase: 'Analyze',
    agentType: 'bug-analyzer',
  },
)

if (!analysisReport) {
  return {
    status: 'stopped',
    stage: 'Analyze',
    reason: 'bug-analyzer 未返回分析报告',
    locationReport,
  }
}

phase('Fix')
const fixReport = await agent(
  `请根据以下材料实施最小且安全的修复。

<bug-description>
${bugDescription}
</bug-description>

<location-report>
${locationReport}
</location-report>

<analysis-report>
${analysisReport}
</analysis-report>

要求：
- 修改前重新读取相关文件，确认分析与当前代码一致。
- 只修改修复该根因所必需的代码，并匹配现有风格。
- 如适合，在现有测试结构中补充能够稳定复现问题的回归测试。
- 如果根因未确认、相关代码不存在或修复缺少必要信息，不要猜测修改；请在报告中说明阻塞原因。
- 输出变更文件、修复原理、潜在副作用以及交给验证阶段的测试重点。`,
  {
    label: 'bug-fixer',
    phase: 'Fix',
    agentType: 'bug-fixer',
  },
)

if (!fixReport) {
  return {
    status: 'stopped',
    stage: 'Fix',
    reason: 'bug-fixer 未返回修复报告',
    locationReport,
    analysisReport,
  }
}

phase('Verify')
const verificationReport = await agent(
  `请验证本次 bug 修复，并如实给出通过或失败结论。

<bug-description>
${bugDescription}
</bug-description>

<analysis-report>
${analysisReport}
</analysis-report>

<fix-report>
${fixReport}
</fix-report>

要求：
- 检查实际代码变更是否与分析和修复报告一致。
- 先做相关文件的语法检查，再运行完整测试套件。
- 如果有针对该 bug 的回归测试，确认它能覆盖原始触发条件。
- 区分本次修复导致的失败与仓库中已有的无关失败。
- 如果修复器未修改代码，也必须明确报告未完成验证，不能给出“可合并”结论。
- 输出执行的命令、测试数量、失败详情、回归检查和最终结论。`,
  {
    label: 'bug-verifier',
    phase: 'Verify',
    agentType: 'bug-verifier',
  },
)

if (!verificationReport) {
  return {
    status: 'stopped',
    stage: 'Verify',
    reason: 'bug-verifier 未返回验证报告',
    locationReport,
    analysisReport,
    fixReport,
  }
}

return {
  status: 'completed',
  bugDescription,
  reports: {
    location: locationReport,
    analysis: analysisReport,
    fix: fixReport,
    verification: verificationReport,
  },
}
