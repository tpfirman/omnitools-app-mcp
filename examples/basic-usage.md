# Example: Basic MCP Server Usage

This example demonstrates how to run and test the OmniTools MCP Server.

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Testing with MCP Inspector

You can test the server using the MCP Inspector tool:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Testing the Ping Tool

The server includes a basic `ping` tool for connectivity testing.

### Example MCP Call (JSON-RPC format)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "ping",
    "arguments": {
      "message": "Hello, OmniTools!"
    }
  }
}
```

### Expected Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Pong! You said: Hello, OmniTools!"
      }
    ]
  }
}
```

## Reading Server Configuration

You can read the server configuration via the `omnitools://config` resource:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "omnitools://config"
  }
}
```

This will return the current server configuration including timeouts, file limits, and allowed directories.

## Using with Claude Desktop

Add to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "omnitools": {
      "command": "node",
      "args": ["/path/to/omnitools-app-mcp/dist/index.js"],
      "env": {
        "ALLOWED_DIRECTORIES": "/tmp,/home/user/workspace"
      }
    }
  }
}
```

## Using with VS Code (LM Studio)

Configure in your VS Code MCP settings to point to the built server.

## Environment Variables

The server reads from `.env` file or environment variables:

```bash
TOOL_TIMEOUT=60
MAX_FILE_SIZE=52428800
SEARCH_RESULT_LIMIT=10
ALLOWED_DIRECTORIES=/tmp,/home/user/workspace
LOG_LEVEL=info
```

## Logs

Server logs are written to:
- Console (stdout/stderr)
- File: `logs/mcp-server.log`

Set `LOG_LEVEL=debug` for verbose output during development.
