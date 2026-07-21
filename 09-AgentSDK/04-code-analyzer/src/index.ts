import { query, type Options } from '@anthropic-ai/claude-agent-sdk';

interface AnalysisResult {
  output: string[];
  toolsUsed: string[];
  metadata: {
    sessionId?: string;
    durationMs?: number;
    costUsd?: number;
    turns?: number;
  };
  error?: string;
}

async function analyzeCodebase(directory: string): Promise<AnalysisResult> {
  const options: Options = {
    allowedTools: ['Read', 'Grep', 'Glob'],
    permissionMode: 'plan',
    maxTurns: 25,
    cwd: directory,
    model: 'sonnet'
  };

  const result: AnalysisResult = {
    output: [],
    toolsUsed: [],
    metadata: {}
  };

  for await (const message of query({
    prompt: `分析 ${directory} 目录的代码结构`,
    options,
  })) {
    if (message.type === 'assistant') {
      for (const block of message.message.content) {
        if (block.type === 'text') {
          result.output.push(block.text);
        } else if (block.type === 'tool_use') {
          result.toolsUsed.push(`${block.name}: ${JSON.stringify(block.input)}`);
          console.log(`  [scanning] ${block.name}`);
        }
      }

      if (message.error) {
        result.error = message.error;
      }
    } else if (message.type === 'result') {
      result.metadata = {
        sessionId: message.session_id,
        durationMs: message.duration_ms,
        costUsd: message.total_cost_usd,
        turns: message.num_turns
      };

      if (message.subtype !== 'success') {
        result.error = message.errors.join('\n');
      }
    }
  }

  return result;
}

// 使用
async function main() {
  const directory = process.argv[2] || '.';
  console.log(`Analyzing: ${directory}`);

  const result = await analyzeCodebase(directory);

  console.log('\nReport:');
  console.log(result.output.join('\n'));

  console.log('\nStatistics:');
  console.log(`Duration: ${result.metadata.durationMs}ms`);
  console.log(`Cost: $${result.metadata.costUsd}`);
}

main().catch(console.error);
