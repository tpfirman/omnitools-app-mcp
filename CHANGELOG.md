# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dispatcher tool architecture with `omni_search` and `omni_run`
- Tool catalog MCP resource: `omnitools://catalog`
- Core tool registry with ranked keyword search
- 14 tools across text, data, file, document, and media categories
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
