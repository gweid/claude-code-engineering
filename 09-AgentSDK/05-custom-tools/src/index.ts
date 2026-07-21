import {
  tool,
  createSdkMcpServer,
  query,
  type Query,
  type Options,
} from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const getWeather = tool(
  'get_weather',
  'Get current weather for a city',
  {
    city: z.string(),
  },
  async ({ city }) => {
    const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY`);
    const weatherData = await weather.json();
    return {
      content: [
        {
          type: 'text',
          text: `The current weather in ${city} is ${weatherData.main.temp}°C.`,
        }
      ]
    }
  }
);

const toolsServer = createSdkMcpServer({
  name: 'tools_server',
  version: '1.0.0',
  tools: [getWeather],
});

const main = async () => {
  const options: Options = {
    maxTurns: 5,
    mcpServers: { 'weather': toolsServer },
    allowedTools: ['mcp__weather__get_weather'],
  };
  
  const agent: Query = query({
    prompt: 'What is the weather in Shenzhen?',
    options,
  });

  for await (const message of agent) {
    if (message.type === 'result') {}
  }
}

main();