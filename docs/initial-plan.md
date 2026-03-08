# Project Plan: OmniTools MCP Server

## 1. Project Overview
This project aims to an MCP server to allow AI agents access to the self hosted "omnitools.app" package.
https://omnitools.app/
https://github.com/iib0011/omni-tools

**Key Objective:** Provide a feature rich set of tools for use by an AI Agent to perform simple tasks, while reducing token usage.

### What is OmniTools
Omnitools is an expansive collection of self hosted utilities for simple tasks.


---

## 2. Requirements & Features

### Core Requirements
- **Protocol:** MCP (JSON-RPC over STDIO).
- **Runtime:** Node.js (TypeScript) for seamless integration with the existing `omni-tools` codebase.
- **Cross-Platform:** Support for Linux, macOS, and Windows.
- **Provider Agnostic:** Compatible with:
  - Claude Desktop & Claude Code
  - GitHub Copilot
  - Google Gemini (with MCP support)
  - OpenAI-style self-hosted backends (LM Studio)
  - Relevance AI
  - N8N workflow automation

### Planned Features
- **Dynamic Tool Discovery:** A "Dispatcher" pattern where the LLM can search for specific logic rather than loading 100+ individual tool schemas.
- **Media Processing:** Image resizing/conversion, audio extraction, and video metadata retrieval via FFmpeg.
- **Document Management:** PDF merging, text extraction, and CSV-to-JSON transformations.
- **Token Optimization:** Usage of specialized "catalog" resources to keep the active prompt window lean.

---

## 3. Architecture
The server follows a modular architecture:
1. **Transport Layer:** Handles communication with the LLM host via STDIO.
2. **Omni-Bridge:** Maps incoming MCP tool requests to specific functions within the `omni-tools` repository via git submodule.
3. **Utility Layer:** Dedicated modules for handling file system I/O and external binary dependencies (like FFmpeg).

### Token Efficiency Model: "The Dispatcher"
Instead of exposing every function as a top-level tool, we expose:
- `omni_search`: Allows the LLM to search for a capability using natural language (e.g., "how do I convert a PDF to images?"). Returns top 10 results (configurable) ranked by keyword matching.
- `omni_run`: A single execution point that takes a tool name and parameters as a JSON object.

### Key Technical Decisions
- **Omni-Tools Integration:** Git submodule at `/src/lib/omni-tools` for clean version management
- **Node Version:** Node 20 LTS
- **FFmpeg:** Hard requirement with startup validation
- **Timeout:** 60 seconds default (configurable for self-hosted LLMs)
- **File Size Limit:** 50 MB default (no hard limit, configurable)
- **File Access:** Whitelist specific directories (maximum security model)

---

## 4. Suggested Project Structure

```text
omni-mcp-server/
├── src/
│   ├── index.ts           # Entry point & Server setup
│   ├── server.ts          # MCP implementation (Tools/Resources/Prompts)
│   ├── tools/             # Logic wrappers for omni-tools
│   │   ├── media.ts       # Image/Video/Audio
│   │   ├── document.ts    # PDF/CSV/Excel
│   │   └── text.ts        # Formatting & Utilities
│   └── lib/               # omni-tools as git submodule
├── tests/                 # Unit and integration tests
├── examples/              # Sample MCP calls and usage
├── config/                # Configuration schemas
├── scripts/
│   ├── setup.sh           # Setup and dependency validation (cross-platform)
│   └── build.sh           # Build script
├── logs/                  # Runtime logs (created at startup)
├── dist/                  # Compiled TypeScript output
├── .env.example           # Environment variables template
├── .env                   # Runtime config (git ignored)
├── package.json           # Dependencies: @modelcontextprotocol/sdk, zod
├── tsconfig.json          # TypeScript config
├── CHANGELOG.md           # Version and breaking change tracking
└── README.md              # Setup and usage instructions
```

---

## 5. Implementation Roadmap

| Phase | Task | Description |
| :--- | :--- | :--- |
| **Phase 1** | **Base Server** | Initialize MCP SDK with basic connectivity tests. |
| **Phase 2** | **Core Porting** | Wrap the most stable text and data tools from the repo. |
| **Phase 3** | **Media Integration** | Add FFmpeg support for high-value media tasks. |
| **Phase 4** | **Dynamic Dispatcher** | Implement the search/run pattern to optimize token usage. |
| **Phase 5** | **Testing** | Validate with Claude Desktop, LM Studio, and other MCP-compatible platforms (Gemini, N8N, Relevance AI). |

---

## 6. Development Instructions for Agents
*When working on this project, adhere to these guidelines:*

### Code Standards
1. **Zod for Schemas:** Use `zod` for all tool input validation to ensure the LLM sends correct types.
2. **Error Handling:** Return descriptive, user-friendly error messages to the LLM so it can "self-correct" if a tool fails. Log full stack traces to `logs/mcp-server.log` for debugging.
3. **Resource Context:** Use MCP Resources to provide the "Tools Catalog" so the LLM doesn't have to keep tool lists in its memory.
4. **Local Paths:** Always prioritize passing file paths over raw data to avoid hitting context limits.

### Configuration & Environment
- All configurable values must be in `.env.example` with sensible defaults
- Supported env vars: `TOOL_TIMEOUT`, `MAX_FILE_SIZE`, `SEARCH_RESULT_LIMIT`, `SEARCH_RANKING_METHOD`, `ALLOWED_DIRECTORIES`
- `scripts/setup.sh` must validate:
  - Node 20+ installed
  - FFmpeg available and working
  - All dependencies installed
  - Git submodule initialized

### Testing Strategy
- Unit tests for individual tool wrappers
- Integration tests for dispatcher (search + run)
- All Phase 2 tools must pass end-to-end tests with LM Studio in VSCode
- Regression test suite to prevent future breakage

### Error Handling Strategy
- **To LLM:** User-friendly messages with suggested corrective actions
- **To Logs:** Full error context including stack traces, input parameters, and environment
- **Partial Failures:** Report individual results (e.g., "3 of 5 files processed; failed: file.pdf with error: corrupted header")

### Performance Constraints
- Default tool timeout: 60 seconds (configurable for slow self-hosted LLMs)
- Max file size: 50 MB default (configurable, no hard limit)
- Files must be accessed via whitelist (security-first approach)

### Versioning & Maintenance
- Track latest omni-tools version with startup checks
- Document breaking changes in CHANGELOG.md
- Follow semantic versioning for MCP server releases