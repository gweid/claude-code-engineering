import type {
  HookCallback,
  Options,
} from "@anthropic-ai/claude-agent-sdk";

const checkBashCommand: HookCallback = async (
  inputData,
  _toolUseId,
  _context,
) => {
  // HookCallback 可能接收不同事件，先完成类型收窄
  if (
    inputData.hook_event_name !== "PreToolUse" ||
    inputData.tool_name !== "Bash"
  ) {
    return {};
  }

  const toolInput = inputData.tool_input as Record<string, unknown>;
  const command =
    typeof toolInput.command === "string" ? toolInput.command : "";

  // 阻止危险命令
  const dangerousPatterns = [
    "rm -rf",
    "sudo",
    "chmod 777",
  ];

  for (const pattern of dangerousPatterns) {
    if (command.includes(pattern)) {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `Blocked dangerous command: ${pattern}`,
        },
      };
    }
  }

  // 只允许特定命令
  const allowedPrefixes = [
    "npm",
    "git",
    "ls",
    "cat",
  ];

  if (
    !allowedPrefixes.some((prefix) =>
      command.trim().startsWith(prefix),
    )
  ) {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `Command requires approval: ${command}`,
      },
    };
  }

  return {}; // 允许执行
};

const options: Options = {
  hooks: {
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [checkBashCommand],
      },
    ],
  },
};
