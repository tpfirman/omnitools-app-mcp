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

### Updated
- README and usage examples for dispatcher-first workflow
- Server handlers now route through registry-based execution

### Completed
- Phase 1: Base server foundation
- Phase 2: Core tool porting and wrappers
- Phase 3: Media integration baseline
- Phase 4: Dynamic dispatcher implementation
- Phase 5: In progress (client-specific validation remains)

## [0.1.0] - 2026-03-07

### Added
- Project initialization
- Planning documents
- Development guidelines
