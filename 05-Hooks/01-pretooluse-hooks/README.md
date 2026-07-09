使用：

```bash
# 测试 hooks/block-dangerous.sh
请帮我执行 rm -rf ./tmp/test，清理一下临时文件

或者直接验证脚本：echo '{"tool_input":{"command":"rm -rf ./"}}' | ./hooks/block-dangerous.sh


使用 Edit（必须）帮我修改 .env 文件的 PASSWORD 变量，将值改为 "123456"
或者直接验证脚本：echo '{"tool_input":{"file_path":".env","content":"PASSWORD=123456"}}' | ./hooks/protect-files.sh
```