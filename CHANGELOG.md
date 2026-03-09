# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `ToolProvider` interface (`src/tools/types.ts`) enabling new toolsets to be added
  without modifying the core registry
- IT-Tools provider (`src/tools/providers/ittools.ts`) — 10 new tools: `ittools_base64_encode`,
  `ittools_base64_decode`, `ittools_url_encode`, `ittools_url_decode`,
  `ittools_html_entities_encode`, `ittools_html_entities_decode`, `ittools_uuid_generate`,
  `ittools_jwt_decode`, `ittools_hmac_generate`, `ittools_number_base_convert`
- OmniTools provider (`src/tools/providers/omnitools.ts`) wrapping existing 16 tools
- `provider` field on `SearchResult` and catalog entries — search results now identify
  which toolset each tool belongs to
- `CLAUDE.md` project-level Claude Code instructions file
- `.claude/settings.json` project-level shared Claude Code permission defaults

### Updated
- `ToolRegistry` now accepts `ToolProvider[]` instead of hard-coded module imports
- `omnitools://catalog` resource now includes `providers` array and `provider` per tool
- `README.md` updated to reflect 26 tools across two providers
- `package.json` version bumped `0.1.0` → `0.2.0` to match existing CHANGELOG entry

### Removed
- `.instructions.md` — replaced by `CLAUDE.md`

## [0.2.0] - 2026-03-08

### Added
- Dispatcher tool architecture with `omni_search` and `omni_run`
- Tool catalog MCP resource: `omnitools://catalog`
- Core tool registry with ranked keyword search
- 16 tools across text, data, file, document, and media categories
- FFmpeg/ffprobe media wrappers (metadata + audio extraction)
- PDF document wrappers (text extraction + merge via system tools)
- Unit tests for tool registry search and execution paths
- Automated release workflow (`.github/workflows/release.yml`)
- Comprehensive contributing guidelines (`CONTRIBUTING.md`)
- Branch protection setup documentation
- Trunk-based development workflow with `main`, `dev`, and feature branches
- GitHub Actions workflow contract tests for CI, branch source checks, and release automation
- IT-Tools Docker service (`it-tools-ui`) added to compose topology on `localhost:8082`
- Docker compose topology unit test coverage (`tests/unit/docker-compose.test.ts`)

### Updated
- README and usage examples for dispatcher-first workflow
- Server handlers now route through registry-based execution
- Git workflow documentation with detailed branching strategy
- Release process now automated on merges to `main` using `package.json` semantic version and PR-body notes
- Publishing workflow feature plan marked complete
- Branch protection documentation now references repository rulesets
- Docker smoke test now validates both `omni-adapter` and `it-tools-ui` availability

### Completed
- Phase 1: Base server foundation
- Phase 2: Core tool porting and wrappers
- Phase 3: Media integration baseline
- Phase 4: Dynamic dispatcher implementation
- Phase 5: In progress (client-specific validation remains)
- Automated release and workflow infrastructure

## [0.1.0] - 2026-03-07

### Added
- Project initialization
- Planning documents
- Development guidelines
