# Feature: Replace `omni-tools` Submodule with Dockerized Integration

## Goal

Remove `src/lib/omni-tools` as a git submodule and switch to a Docker-first runtime model that keeps OmniTools UI available for humans and supports MCP tool execution through a stable adapter boundary.

## Why

- Submodule management is high-friction (recursive clone, sync commands, commit pinning)
- Docker images are easier to version and operate
- Compose enables future sidecars (`it-tools`, cache, observability) without redesigning runtime
- UI containers remain manually usable while MCP runs AI workflows

## Verified Facts (keep for agent context)

- Upstream OmniTools image exists: `iib0011/omni-tools:latest`
- Upstream supports Docker and Docker Compose for self-hosting
- Container serves SPA via `nginx` (UI hosting)
- Live probe on local instance (`127.0.0.1:8080`): `/`, `/api`, `/api/health`, `/openapi.json`, `/graphql` returned same HTML payload
- Conclusion: UI container exists, but no proven MCP-ready backend API contract
- Current MCP runtime executes local tools from `src/tools/*` and does not depend on the submodule at call time

## Target Architecture

- `mcp-server` (this repo): MCP protocol, auth/rules, dispatch
- `omni-tools-ui`: official OmniTools container for manual use
- `omni-adapter` (new): small API service that exposes deterministic tool contract for MCP

Runtime flow:
1. MCP client calls `omni_search` or `omni_run`
2. MCP server dispatches to `local` or `adapter` backend
3. Adapter executes supported operations and returns normalized result
4. MCP server returns stable MCP response schema

## Scope

In scope:
- Compose baseline for multi-service deployment
- Adapter contract and implementation
- MCP backend toggle and integration path
- Submodule removal after gates pass

Out of scope:
- Direct dependency on undocumented OmniTools internal UI routes
- Big-bang migration with no fallback path

## Phase Plan

### Phase 0: Foundation (no breaking changes)

- Add `docker-compose.yml` with `mcp-server` and `omni-tools-ui`
- Add env config for backend mode (`OMNI_BACKEND=local|adapter`)
- Keep existing local registry as default fallback
- Update `README.md` with Compose topology and startup

### Phase 1: Adapter Contract

Define adapter API:
- `GET /health`
- `POST /tools/search`
- `POST /tools/run`
- Define strict JSON schemas and normalized error model
- Add contract tests

### Phase 2: MCP Integration

- Add adapter-backed registry provider in MCP server
- Wire backend selection by env var
- Preserve `omni_search` / `omni_run` response compatibility
- Add tests for both backend modes

### Phase 3: Hardening

- Migrate an initial low-risk subset (text/data tools first)
- Add latency/error metrics and structured logs
- Benchmark local vs adapter path
- Add retry/timeout policy and graceful degradation

### Phase 4: Submodule Removal

- Remove `src/lib/omni-tools` submodule
- Remove submodule scripts and docs references
- Update CI/setup/release workflows to no longer depend on submodule checkout

## Acceptance Gates (must pass before Phase 4)

- `OMNI_BACKEND=adapter` passes integration tests without MCP behavior regressions
- `docker-compose up` is reliable on Linux/macOS/Windows
- Manual OmniTools UI remains reachable
- Adapter API contract is versioned and test-validated
- Observability captures per-call latency and failure reason
- Build/test/startup succeed without submodule present

## Risks and Controls

- API mismatch risk:
Use adapter-owned deterministic operations; do not depend on undocumented UI internals
- Runtime complexity risk:
Use Compose profiles, health checks, and concise runbook docs
- Licensing/compliance risk with external components:
Keep strict service boundaries, avoid vendoring external code, track image/version/license metadata
- Latency risk:
Use local network containers, bounded timeouts, and selective caching

## Agent Execution Checklist (next thread)

1. Create `docker-compose.yml` baseline and docs
2. Add backend mode env config to MCP server
3. Scaffold `omni-adapter` with `health/search/run`
4. Integrate adapter provider into MCP tool dispatch
5. Add contract + integration tests for `local` and `adapter`
6. Benchmark, harden, and document operations
7. Remove submodule and cleanup scripts/docs

## Status

Ready for implementation
