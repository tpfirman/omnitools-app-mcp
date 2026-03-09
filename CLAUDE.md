# Claude Code Instructions: OmniTools MCP Server

This file is loaded automatically by Claude Code at session start. Follow all instructions here.

---

## Project Identity

OmniTools MCP Server is a Model Context Protocol server that gives AI agents access to self-hosted utility tools. It supports two backend modes:

- **`OMNI_BACKEND=local`** (default): 26 tools served directly from the local registry — no Docker needed
- **`OMNI_BACKEND=adapter`**: Routes through `src/adapter/` HTTP service — use with Docker Compose

Two toolsets are currently integrated:
- **OmniTools** (`provider: omnitools`) — 16 tools: text, data, file, media, document operations
- **IT-Tools** (`provider: ittools`) — 10 tools: base64, URL encode/decode, HTML entities, UUID, JWT decode, HMAC, number base conversion

Both web UIs are available via Docker Compose: omni-tools-ui on port 8080, it-tools-ui on port 8082.

**Current status:** Phases 1–4 complete. Phase 5 (client validation) in progress.

---

## GitHub MCP Enforcement

**ALWAYS use GitHub MCP tools for all GitHub operations** (PRs, issues, comments, labels, branches, releases, and repo metadata).

Do NOT use `gh` CLI directly unless the user explicitly asks for it. If a GitHub MCP tool is unavailable or failing, ask the user before falling back to `gh` CLI.

---

## Key Commands

```bash
npm run dev                # Run MCP server in dev mode (tsx)
npm run adapter:dev        # Run adapter service separately
npm test                   # Run unit tests (must pass before committing)
npm run lint               # ESLint check
npm run lint:fix           # ESLint auto-fix
npm run build              # Compile TypeScript to dist/
npm run benchmark:backends # Compare local vs adapter latency
npm run test:docker        # Docker smoke test
npm run setup              # First-time setup (validates Node, FFmpeg, installs deps)
npm start                  # Run compiled server
```

---

## Architecture

```
omnitools-app-mcp/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server implementation
│   ├── adapter/           # Omni adapter HTTP service + contract schemas
│   ├── backend/           # Backend routing (local vs adapter)
│   ├── config.ts          # Configuration management (Zod validated)
│   ├── tools/
│   │   ├── providers/     # ToolProvider implementations (one per toolset)
│   │   │   ├── omnitools.ts   # OmniTools-inspired tools
│   │   │   └── ittools.ts     # IT-Tools-inspired tools
│   │   ├── registry.ts    # ToolRegistry (accepts provider list)
│   │   ├── catalog.ts     # Catalog resource builder
│   │   ├── types.ts       # ToolDefinition, ToolProvider, SearchResult interfaces
│   │   └── *.ts           # Tool implementations (text, data, file, media, document)
│   └── utils/             # Utilities (logger, validation)
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── scripts/               # Setup and build scripts
├── docs/                  # Documentation
│   └── examples/          # Usage examples
└── CLAUDE.md              # Claude Code project instructions (this file)
```

**Transport:** JSON-RPC over STDIO
**Backend router:** `OMNI_BACKEND=local|adapter`
**Adapter contract:** `/health`, `/tools/search`, `/tools/run`

### Adding a New Toolset

The architecture uses a `ToolProvider` interface. New toolsets plug in without modifying existing code:

```typescript
// src/tools/types.ts
interface ToolProvider {
  readonly id: string;        // e.g. 'my-toolset'
  readonly name: string;      // e.g. 'My Toolset'
  getTools(): ToolDefinition[];
}
```

Steps to add a new toolset:
1. Create `src/tools/providers/mytoolset.ts` implementing `ToolProvider`
2. Define `ToolDefinition[]` — each tool needs `name`, `description`, `category`, `tags`, a Zod `schema`, and `execute`
3. Add the provider to `defaultProviders` in `src/backend/localBackend.ts`
4. Add it to the `ToolRegistry(...)` call in `src/adapter/index.ts`
5. Tools appear automatically in `omnitools://catalog` and `omni_search` results, stamped with `provider.id`

Each `execute` signature: `async (input: unknown, context: ToolContext) => Promise<ToolResult>`. Always call `mySchema.parse(input)` at the top — the registry passes raw input.

---

## Coding Standards

### TypeScript
- **Strict mode enabled.** No `any` types unless absolutely necessary.
- Use `zod` for ALL input validation (tool parameters, config, file paths)
- Prefer functional patterns over classes where appropriate
- Export types/interfaces for all public APIs

### Error Handling
- **User-facing errors:** Return clear, actionable messages to the LLM
  - Good: `"File not found: /path/to/file.txt. Ensure the path is correct and the file exists in an allowed directory."`
  - Bad: `"ENOENT error"`
- **Log everything:** Full stack traces + context to `logs/mcp-server.log`
- **Partial failures:** Report what succeeded and what failed individually
  ```typescript
  {
    processed: 3,
    failed: 1,
    errors: [{ file: "doc.pdf", error: "Corrupted header" }]
  }
  ```

### File Operations
- **Security first:** ALL file paths must be validated against `ALLOWED_DIRECTORIES` whitelist
- Sanitize paths to prevent traversal attacks
- Use absolute paths internally; resolve relative paths from user input
- Check file sizes before processing (respect `MAX_FILE_SIZE`)

### Tool Implementation
Each tool wrapper in `src/tools/` must:
1. Define Zod schema for inputs
2. Validate file paths against whitelist
3. Respect timeout settings (`TOOL_TIMEOUT`)
4. Return structured results (never throw to LLM)
5. Log detailed errors to file

---

## Testing Requirements

### When Adding New Tools
1. Write unit test in `tests/unit/` for the tool wrapper
2. Add integration test in `tests/integration/` for end-to-end flow
3. Update regression suite if behavior changes
4. Document example usage in `docs/examples/`

### Before Committing
- Run full test suite: `npm test`
- Check linting: `npm run lint`
- Verify build: `npm run build`
- Update documentation (README, CHANGELOG) if needed

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `OMNI_BACKEND` | `local` | Tool backend mode (`local` or `adapter`) |
| `OMNI_ADAPTER_URL` | `http://127.0.0.1:8081` | Adapter base URL for `adapter` mode |
| `IT_TOOLS_URL` | `http://127.0.0.1:8082` | IT-Tools URL (Docker topology / future provider) |
| `TOOL_TIMEOUT` | `60` | Tool execution timeout (seconds) |
| `MAX_FILE_SIZE` | `52428800` | Maximum file size (bytes, 50 MB) |
| `SEARCH_RESULT_LIMIT` | `10` | Number of search results |
| `SEARCH_RANKING_METHOD` | `keyword` | Ranking algorithm |
| `ALLOWED_DIRECTORIES` | `/tmp` | Comma-separated whitelisted paths |
| `LOG_LEVEL` | `info` | Log verbosity (`debug|info|warn|error`) |
| `LOG_FILE` | `logs/mcp-server.log` | Log file path |
| `FFMPEG_PATH` | `ffmpeg` | FFmpeg binary path |

---

## Git Workflow

### Branching Strategy
- **main:** Production-ready code only
- **dev:** Integration branch for active development
- **feature/[name]:** New features (branch from `main`)
- **bugfix/[name]:** Bug fixes (branch from `main`)
- **hotfix/[name]:** Urgent fixes (branch from `main`)

### Mandatory Branch Sync Before New Work
```bash
git checkout main && git pull origin main
git checkout dev && git pull origin dev
```
Never create a feature/bugfix branch from stale local refs.

### Commit Conventions
Follow Conventional Commits specification:

- **feat:** New feature — `feat: add omni_search tool with keyword ranking`
- **fix:** Bug fix — `fix: correct file path validation in whitelist check`
- **chore:** Maintenance — `chore: update dependencies to latest versions`
- **docs:** Documentation — `docs: update README with installation steps`
- **test:** Tests — `test: add unit tests for text tool wrappers`
- **refactor:** Code restructuring — `refactor: extract path validation to utility function`
- **perf:** Performance — `perf: optimize search ranking algorithm`
- **style:** Formatting only — `style: apply prettier formatting to server.ts`

**Commit Message Format:**
```
<type>: <short summary> (max 50 chars)

<optional detailed description>
- What changed
- Why it changed
- Any breaking changes or important notes
```

### Merge Process
```bash
# Update your branch with latest main
git checkout main && git pull origin main
git checkout feature/your-feature
git merge main

# Open PR: feature/your-feature -> dev
# Open PR: dev -> main for releases
```

---

## AI Agent Rules

1. **Never merge your own PRs.** All merges require human approval.
2. **Never autonomously create issues or PRs** without human approval first.
3. **All GitHub operations use MCP tools** — not `gh` CLI.
4. When in doubt about a decision, ask the human before proceeding.

---

## What NOT to Do

- Do NOT push directly to `main` or `dev` — use PRs
- Do NOT commit `.env` or any secrets
- Do NOT modify `docs/initial-plan.md` (archived historical document)
- Do NOT create files in `docs/plans/features/` — use GitHub Issues for feature tracking
- Do NOT append to `docs/ISSUES_LOG.md` — that file is deprecated
- Do NOT skip `npm test` before committing

---

## Security Checklist

- [ ] File paths validated against `ALLOWED_DIRECTORIES` whitelist
- [ ] Input sanitized (no path traversal: `../`, absolute paths checked)
- [ ] Subprocesses spawned with minimal permissions
- [ ] No sensitive data logged to user-facing errors
- [ ] Timeouts enforced to prevent DoS

## Performance Checklist

- [ ] Tools respect `TOOL_TIMEOUT` (default 60s)
- [ ] File size checked before processing (`MAX_FILE_SIZE`)
- [ ] Large operations use streaming when possible
- [ ] Search results limited (default 10, configurable)

---

## References

- **Issues & Features:** [GitHub Issues](https://github.com/tpfirman/omnitools-app-mcp/issues)
- **MCP Spec:** https://modelcontextprotocol.io/
- **OmniTools:** https://github.com/iib0011/omni-tools
