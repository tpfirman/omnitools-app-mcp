# OmniTools MCP Server

A Model Context Protocol (MCP) server that provides AI agents access to self-hosted [OmniTools](https://omnitools.app/) utilities. This server enables LLMs to perform simple tasks efficiently while optimizing token usage through a smart dispatcher pattern.

## Features

- **Dynamic Tool Discovery**: Search-based tool discovery instead of loading 100+ schemas
- **Dispatcher Runtime**: `omni_search` + `omni_run` for low-token tool invocation
- **26 Tools across Two Providers**: OmniTools (text, data, file, media, document) + IT-Tools (encoding, crypto, web utilities)
- **Extensible Provider Architecture**: Add new toolsets by implementing `ToolProvider` — no core changes needed
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
git clone https://github.com/tpfirman/omnitools-app-mcp.git
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

# Backend mode
OMNI_BACKEND=local
OMNI_ADAPTER_URL=http://127.0.0.1:8081
IT_TOOLS_URL=http://127.0.0.1:8082

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

### 4. Run Docker Compose Topology

```bash
docker compose up --build
```

Services:
- `omni-tools-ui`: official OmniTools UI at `http://localhost:8080`
- `it-tools-ui`: official IT-Tools UI at `http://localhost:8082`
- `omni-adapter`: adapter API at `http://localhost:8081` (`/health`, `/tools/search`, `/tools/run`)
- `mcp-server`: MCP runtime configured with `OMNI_BACKEND=adapter`

### 5. Add MCP Server to VS Code (User Scope)

Use user-level MCP settings so no repository artifacts are created.

1. Open your VS Code **User** settings JSON file:
  - Linux: `~/.config/Code/User/mcp.json`
  - macOS: `~/Library/Application Support/Code/User/mcp.json`
  - Windows: `%APPDATA%\\Code\\User\\mcp.json`
2. Add this server configuration under `mcpServers`:

```json
{
  "mcpServers": {
    "omnitools": {
      "command": "node",
      "args": ["/absolute/path/to/omnitools-app-mcp/dist/index.js"],
      "env": {
        "ALLOWED_DIRECTORIES": "/tmp,/home/user/workspace",
        "TOOL_TIMEOUT": "60",
        "MAX_FILE_SIZE": "52428800",
        "SEARCH_RESULT_LIMIT": "10",
        "OMNI_BACKEND": "local",
        "OMNI_ADAPTER_URL": "http://127.0.0.1:8081",
        "IT_TOOLS_URL": "http://127.0.0.1:8082",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

3. Save `mcp.json` and reload VS Code.

Quick verification:
- Run an MCP tool listing command from your MCP client in VS Code
- Confirm `omni_search` and `omni_run` are available
- Check `logs/mcp-server.log` if startup fails

## Architecture

The server follows a modular architecture:

1. **Transport Layer**: JSON-RPC over STDIO communication
2. **Backend Router**: `OMNI_BACKEND=local|adapter` selects execution path
3. **Adapter Boundary**: Optional HTTP adapter (`/health`, `/tools/search`, `/tools/run`)
4. **Utility Layer**: File I/O, FFmpeg, and system dependencies

### Token Efficiency: The Dispatcher Pattern

Instead of exposing 100+ individual tool schemas, we use:

- **`omni_search`**: Natural language search for capabilities
- **`omni_run`**: Single execution endpoint with tool name + parameters
- **`omnitools://catalog`**: Resource containing available tools and schemas
- **`omnitools://config`**: Resource containing current server configuration

This keeps the LLM context lean while providing full functionality.

## Development

### Project Structure

```
omnitools-app-mcp/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server implementation
│   ├── adapter/           # Omni adapter service + contract schemas
│   ├── backend/           # Backend routing (local vs adapter)
│   ├── config.ts          # Configuration management
│   ├── tools/
│   │   ├── providers/     # ToolProvider implementations (omnitools, ittools, …)
│   │   └── …              # Tool implementations and registry
│   └── utils/             # Utilities (logger, validation)
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── scripts/               # Setup and build scripts
├── docs/                  # Documentation
│   └── examples/          # Usage examples
└── CLAUDE.md              # Claude Code project instructions
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

### Benchmarking Backends

```bash
npm run benchmark:backends
```

Notes:
- Always measures local registry latency
- Measures adapter latency only when `OMNI_ADAPTER_URL` is reachable

### CI and Branch Protection

- GitHub Actions workflow: `.github/workflows/ci.yml`
- CI runs on PRs to `main` and pushes to `dev`/`feature/**`
- Required status check to protect `main`: `Lint, Test, Build (Node 20)`
- Configure repository rulesets in GitHub: Settings -> Rules -> Rulesets

## Git Workflow

This project follows a **trunk-based development** workflow:

```
main (production) ← PR from dev when ready to release
  ↑
dev (integration) ← PR from all feature branches
  ↑
feature/*, bugfix/*, hotfix/* (working branches from main)
```

### Quick Reference

1. **Keep local branches synced:**
   ```bash
   git checkout main && git pull origin main
   git checkout dev && git pull origin dev
   ```

2. **Create branches from `main`:**
   ```bash
   git checkout main
   git checkout -b feature/my-feature
   ```

3. **Open PR to `dev`** (not `main`) when feature is complete

4. **Release process:** Merge PR `dev` → `main`; `release.yml` publishes/updates the GitHub Release using `package.json` version and PR body notes.

**For detailed workflow instructions, see [CONTRIBUTING.md](CONTRIBUTING.md)**

## Implementation Status

### Completed

- ✅ **Phase 1: Base Server**
  - MCP SDK integration with STDIO transport
  - Configuration management with Zod validation
  - Startup validation (Node version, FFmpeg)
  - Logging system and setup automation script

- ✅ **Phase 2: Core Porting**
  - 16 OmniTools-inspired tools across text, data, file, media, and document categories
  - Includes CSV-to-JSON, JSON utilities, hashing, file IO, and PDF operations

- ✅ **Phase 3: Media Integration**
  - FFmpeg/ffprobe wrappers for media metadata and audio extraction

- ✅ **Phase 4: Dynamic Dispatcher**
  - `omni_search` tool with ranked keyword matching
  - `omni_run` tool with schema-validated execution
  - `omnitools://catalog` MCP resource for tool discovery

- ✅ **IT-Tools Provider**
  - 10 IT-Tools-inspired tools: Base64, URL encode/decode, HTML entities, UUID, JWT decode, HMAC, number base conversion
  - Extensible `ToolProvider` architecture — add new toolsets without touching the core registry
  - All tools advertised in catalog with `provider` field for easy identification

### Remaining

- ⏳ **Phase 5: Client Validation**
  - End-to-end validation with Claude Desktop, LM Studio, and other MCP clients
  - Broader regression coverage for external integrations

## Configuration Reference

All environment variables with defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `TOOL_TIMEOUT` | `60` | Tool execution timeout (seconds) |
| `MAX_FILE_SIZE` | `52428800` | Maximum file size (bytes) |
| `SEARCH_RESULT_LIMIT` | `10` | Number of search results |
| `SEARCH_RANKING_METHOD` | `keyword` | Ranking algorithm |
| `OMNI_BACKEND` | `local` | Tool backend mode (`local` or `adapter`) |
| `OMNI_ADAPTER_URL` | `http://127.0.0.1:8081` | Adapter base URL for `adapter` mode |
| `IT_TOOLS_URL` | `http://127.0.0.1:8082` | IT-Tools UI base URL for Docker topology and future provider integration |
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

We welcome contributions! Please follow these guidelines:

1. **Read [CONTRIBUTING.md](CONTRIBUTING.md)** for detailed workflow
2. **Branch from `main`** and PR into `dev`
3. **Use conventional commits** (`feat:`, `fix:`, `docs:`, etc.)
4. **Write tests** for new features
5. **Update documentation** as needed
6. **Ensure CI passes** before requesting review

## Releases

Releases are automated via GitHub Actions and triggered when changes are merged into `main`:

1. **Development:** Feature branches → `dev` via PR
2. **Release preparation:** `dev` → `main` via PR
3. **Version source:** `package.json` `version` field (semantic version)
4. **GitHub Release:** Workflow builds, packages, and publishes artifacts automatically
5. **Release notes:** Merged PR body with footer `For a full list of changes, see CHANGELOG.md`

### Creating a Semantic Version Release

```bash
# Before opening release PR, bump version in your branch
npm version patch --no-git-tag-version

# Commit the version bump and changes, then open PR dev -> main
# Merging that PR triggers release workflow automatically
```

The release workflow (`.github/workflows/release.yml`) automatically:
- ✅ Runs full test suite
- ✅ Builds production bundle
- ✅ Creates/updates GitHub Release using `v<package.json version>`
- ✅ Uses merged PR body as release notes
- ✅ Attaches distribution artifacts (.tar.gz and .zip)
- ✅ Updates `latest` tag for stable versions

## License

This project is licensed under the MIT License. See `LICENSE`.

## Credits

- `omni-tools` by `iib0011`: https://github.com/iib0011/omni-tools
- OmniTools website: https://omnitools.app/

- `it-tools` by `CorentinTh` https://github.com/CorentinTh/it-tools
- IT -Tools website: https://it-tools.tech/


## Support

For issues and questions:
- [Open a GitHub Issue](https://github.com/tpfirman/omnitools-app-mcp/issues) for bugs or feature requests
- Review [`CLAUDE.md`](CLAUDE.md) for development guidelines
