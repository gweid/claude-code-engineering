/**
 * 自定义 MCP 服务器示例
 *
 * 这个服务器提供以下功能：
 * 1. todo - 管理待办事项
 * 2. notes - 管理笔记
 * 3. timer - 计时器工具
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: Date;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

// 内存存储
const todos: Todo[] = [];
const notes: Note[] = [];

// 生成唯一 id
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// 创建 mcp 服务器
const server = new McpServer({
  name: 'custom-mcp',
  version: '1.0.0',
});

// ---------- Todo 工具 ----------

// 添加待办事项
server.registerTool(
  'todo_add',
  {
    title: '添加新的待办事项',
    description: '添加新的待办事项到列表中',
    inputSchema: z.object({
      text: z.string().describe("待办事项内容"),
    }),
  },
  async ({ text }) => {

    const todo: Todo = {
      id: generateId(),
      text,
      done: false,
      createdAt: new Date(),
    };

    todos.push(todo);

    return {
      content: [
        {
          type: 'text',
          text: `Added todo: ${todo.id} - ${todo.text}`,
        }
      ]
    };
  }
);

// 列出待办事项
server.registerTool(
  'todo_list',
  {
    title: '列出所有待办事项',
    description: '列出列表中的所有待办事项',
    inputSchema: {
      showDone: z.boolean().optional().describe("包含已完成的事项"),
    },
  },
  async ({ showDone = true}) => {
    const filtered = showDone ? todos : todos.filter(todo => !todo.done);

    const text = 
      filtered.length === 0
        ? '没有待办事项'
        : filtered
            .map((todo) => `[${todo.done ? "x" : " "}] ${todo.id}: ${todo.text}`)
            .join("\n");

    return {
      content: [
        {
          type: 'text',
          text: `Todos:\n${text}`,
        },
      ],
    };
  }
);

// 完成待办事项
server.registerTool(
  'todo_complete',
  {
    title: '标记待办事项为已完成',
    description: '标记待办事项为已完成',
    inputSchema: {
      id: z.string().describe("待办事项 ID"),
    },
  },
  async ( { id } ) => {
    const todo = todos.find(todo => todo.id === id);

    if (!todo) {
      return {
        content: [
          {
            type: 'text',
            text: `未找到任务: ${id}`,
          },
        ],
        isError: true,
      };
    }

    todo.done = true;

    return {
      content: [
        {
          type: 'text',
          text: `已完成：${todo.text}`,
        },
      ],
    };
  }
);

// 删除待办事项
server.registerTool(
  'todo_delete',
  {
    title: '删除待办事项',
    description: '从列表中删除待办事项',
    inputSchema: {
      id: z.string().describe("待办事项 ID"),
    },
  },
  async ( { id } ) => {
    const index = todos.findIndex(todo => todo.id === id);

    if (index === -1) {
      return {
        content: [
          {
            type: 'text',
            text: `未找到任务: ${id}`,
          },
        ],
        isError: true,
      };
    }

    const [ deleted ] = todos.splice(index, 1);

    return {
      content: [
        {
          type: 'text',
          text: `已删除任务: ${deleted.text}`,
        },
      ],
    };
  }
);

// ---------- 启动服务器 ---------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server started");
}

main().catch(console.error);
