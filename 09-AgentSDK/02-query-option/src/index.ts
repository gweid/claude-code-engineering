import {
  query,
  type Options,
  type Query,
 } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  const options: Options = {
    allowedTools: ['Read', 'Grep', 'Glob'],
    maxTurns: 10,
    permissionMode: 'plan',
  };

  const agent: Query = query({
    prompt: '分析 src/ 目录的代码结构',
    options,
  });

  for await (const message of agent) {
    if (message.type === 'result') {
      if (message.subtype === 'success') {
        console.log('Result:', message.result);
      } else {
        console.error('Error:', message.errors);
      }
    }
  }
}

main();
