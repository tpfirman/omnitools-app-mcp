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

## Dispatcher Workflow (`omni_search` + `omni_run`)

### 1. Search for a capability

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "omni_search",
    "arguments": {
      "query": "convert csv to json"
    }
  }
}
```

### 2. Run the selected tool

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "omni_run",
    "arguments": {
      "toolName": "csv_to_json",
      "args": {
        "csv": "name,age\nAlice,30\nBob,25"
      }
    }
  }
}
```

### 3. Optional ping connectivity test

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "ping",
    "arguments": {
      "message": "Hello, OmniTools!"
    }
  }
}
```

## Reading Server Configuration and Catalog

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

This returns current server configuration including timeouts, file limits, and allowed directories.

You can also read the tool catalog resource:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "omnitools://catalog"
  }
}
```

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
