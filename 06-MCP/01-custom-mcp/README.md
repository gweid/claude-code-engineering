打包构建：

```bash
npm run build
```



启动：

```bash
npm run start
```



接入 mcp：

```json
{
  "mcpServers": {
    "custom-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/gweid/Desktop/claude-code-engineering/06-MCP/01-custom-mcp/dist/index.js"]
    }
  }
}
```
