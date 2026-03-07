# OmniTools MCP Server

A Model Context Protocol (MCP) server that provides AI agents access to self-hosted [OmniTools](https://omnitools.app/) utilities. This server enables LLMs to perform simple tasks efficiently while optimizing token usage through a smart dispatcher pattern.

## Features

- **Dynamic Tool Discovery**: Search-based tool discovery instead of loading 100+ schemas
- **Token Optimization**: Specialized catalog resources keep prompt windows lean
- **Multiple Platform Support**: Compatible with Claude Desktop, GitHub Copilot, Google Gemini, LM Studio, Relevance AI, and N8N
- **Security First**: Whitelist-based file access and path sanitization
- **Self-Hosted**: Run locally with full control over your data

## Requirements

- **Node.js**: Version 20 LTS or higher
- **FFmpeg**: Required for media processing tools
- **Operating System**: Linux, macOS, or Windows

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd omnitools-app-mcp

# Run automated setup
npm run setup
```

The setup script will:
- ✓ Validate Node.js version (20+)
- ✓ Check FFmpeg availability
- ✓ Install dependencies
- ✓ Build TypeScript
- ✓ Create necessary directories

### 2. Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key configuration options:

```bash
# Tool execution timeout (seconds)
TOOL_TIMEOUT=60

# Maximum file size (bytes)
MAX_FILE_SIZE=52428800  # 50 MB

# Search configuration
SEARCH_RESULT_LIMIT=10

# Security: whitelist allowed directories
ALLOWED_DIRECTORIES=/tmp,/home/user/workspace

# Logging
LOG_LEVEL=info
LOG_FILE=logs/mcp-server.log
```

### 3. Run the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

## Architecture

The server follows a modular architecture:

1. **Transport Layer**: JSON-RPC over STDIO communication
2. **Omni-Bridge**: Maps MCP requests to OmniTools functions
3. **Utility Layer**: File I/O, FFmpeg, and system dependencies

### Token Efficiency: The Dispatcher Pattern

Instead of exposing 100+ individual tool schemas, we use:

- **`omni_search`**: Natural language search for capabilities
- **`omni_run`**: Single execution endpoint with tool name + parameters

This keeps the LLM context lean while providing full functionality.

## Development

### Project Structure

```
omnitools-app-mcp/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server implementation
│   ├── config.ts          # Configuration management
│   ├── tools/             # Tool wrappers
│   └── utils/             # Utilities (logger, validation)
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── examples/              # Usage examples
├── scripts/               # Setup and build scripts
├── docs/                  # Documentation
└── .instructions.md       # AI agent guidelines
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Building

```bash
# Compile TypeScript
npm run build
```

## Git Workflow

This project follows a structured Git workflow with conventional commits:

- **Branches**: `main`, `dev`, `feature/*`, `bugfix/*`, `hotfix/*`
- **Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

See [`.instructions.md`](.instructions.md) for complete guidelines.

## Phase 1 Status ✓

Phase 1 (Base Server) is complete:

- ✅ MCP SDK integration
- ✅ Basic server skeleton with STDIO transport
- ✅ Configuration management with Zod validation
- ✅ Startup validation (Node version, FFmpeg)
- ✅ Logging system
- ✅ Basic connectivity test (ping tool)
- ✅ Setup automation script

**Next**: Phase 2 will add 10-15 core tools (text, document, utilities).

## Configuration Reference

All environment variables with defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `TOOL_TIMEOUT` | `60` | Tool execution timeout (seconds) |
| `MAX_FILE_SIZE` | `52428800` | Maximum file size (bytes) |
| `SEARCH_RESULT_LIMIT` | `10` | Number of search results |
| `SEARCH_RANKING_METHOD` | `keyword` | Ranking algorithm |
| `ALLOWED_DIRECTORIES` | `/tmp` | Comma-separated paths |
| `LOG_LEVEL` | `info` | Log verbosity level |
| `LOG_FILE` | `logs/mcp-server.log` | Log file path |
| `FFMPEG_PATH` | `ffmpeg` | FFmpeg binary path |

## Troubleshooting

### FFmpeg Not Found

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Or specify path in .env
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### Permission Errors

Ensure allowed directories in `ALLOWED_DIRECTORIES` are:
- Accessible by the current user
- Absolute paths
- Comma-separated with no spaces

### Port/STDIO Issues

The server uses STDIO transport (not network ports). Ensure your MCP client is configured for STDIO communication.

## Contributing

1. Follow the guidelines in [`.instructions.md`](.instructions.md)
2. Use conventional commits
3. Write tests for new features
4. Update documentation

## License

MIT

## Links

- [OmniTools](https://omnitools.app/)
- [OmniTools GitHub](https://github.com/iib0011/omni-tools)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Project Plan](docs/plans/initial-plan.md)

## Support

For issues and questions:
- Check [`docs/ISSUES_LOG.md`](docs/ISSUES_LOG.md) for known issues
- Review [`.instructions.md`](.instructions.md) for development guidelines
- Open an issue on GitHub (once published)
