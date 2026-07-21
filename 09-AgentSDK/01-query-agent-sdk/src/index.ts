import { query } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  for await (const message of query({ prompt: '解释什么是递归' })) {
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
