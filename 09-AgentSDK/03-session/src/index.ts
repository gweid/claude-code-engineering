import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { query, type Options } from '@anthropic-ai/claude-agent-sdk';

type Sessions = Record<string, string>;

const SESSIONS_FILE = 'sessions.json';

function saveSession(name: string, sessionId: string) {
  let sessions: Sessions = {};

  if (existsSync(SESSIONS_FILE)) {
    sessions = JSON.parse(readFileSync(SESSIONS_FILE, 'utf-8'));
  }

  sessions[name] = sessionId;
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

function loadSession(name: string) {
  if (!existsSync(SESSIONS_FILE)) {
    return undefined;
  }

  const sessions = JSON.parse(readFileSync(SESSIONS_FILE, 'utf-8'));
  return sessions[name];
}

async function main() {
  // 尝试恢复会话
  const sessionId = loadSession('project-review');

  const options: Options = sessionId ? { resume: sessionId } : {};

  for await (const message of query({prompt: '继续代码审查', options})) {
    if (message.type === "result") {
      // 保存会话，以便下次恢复
      saveSession("project-review", message.session_id);
    }
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
