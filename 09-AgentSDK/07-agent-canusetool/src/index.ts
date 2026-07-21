import type { Options } from "@anthropic-ai/claude-agent-sdk";

// 受保护的文件列表
const PROTECTED_FILES = [
  ".env",
  "secrets.json",
  "config/production.yaml",
  "database/migrations/",
] as const;

const canUseTool: NonNullable<Options["canUseTool"]> = async (
  toolName,
  toolInput,
  _context,
) => {
  // 检查文件操作
  if (["Write", "Edit", "Read"].includes(toolName)) {
    const filePath =
      typeof toolInput.file_path === "string"
        ? toolInput.file_path
        : "";

    for (const protectedPath of PROTECTED_FILES) {
      if (filePath.includes(protectedPath)) {
        return {
          behavior: "deny",
          message: `Access to ${protectedPath} is not allowed`,
        };
      }
    }
  }

  // 检查 Bash 命令
  if (toolName === "Bash") {
    const command =
      typeof toolInput.command === "string"
        ? toolInput.command
        : "";

    // 禁止网络操作
    const networkCommands = ["curl", "wget", "nc", "ssh"];

    for (const cmd of networkCommands) {
      if (command.includes(cmd)) {
        return {
          behavior: "deny",
          message: `Network command '${cmd}' is not allowed`,
        };
      }
    }
  }

  return {
    behavior: "allow",
    updatedInput: toolInput,
  };
};

const options: Options = {
  canUseTool,
};
