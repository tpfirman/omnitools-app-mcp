# Feature: OmniTools Dependency — Submodule vs Docker Image

## Brief Description

Investigate whether the current git submodule dependency on `omni-tools` can be replaced with the official OmniTools Docker image, simplifying dependency management and deployment.

## Motivation

The submodule approach adds friction: it requires recursive cloning, manual sync commands, and version pinning at the git commit level. If OmniTools ships a usable Docker image, the MCP server could call it as a sidecar service instead, removing the submodule entirely and making updates a simple image tag bump.

## Initial Thoughts

- Confirm whether an official OmniTools Docker image exists and is actively maintained
- Determine what the image exposes — HTTP API, CLI, or something else — and whether it maps cleanly to the current submodule usage pattern
- Assess the tradeoff: Docker adds a runtime dependency and introduces network overhead for tool calls, but eliminates submodule complexity and makes the server easier to set up
- If viable, the `omni_bridge` layer would call the Docker container rather than the local submodule — this may be a small or large change depending on how tightly coupled the current integration is
- Consider whether Docker availability can be assumed across all target platforms (Linux, macOS, Windows)
- Favor a simple `docker-compose` baseline for local and deployment workflows so the stack can be extended later with additional sidecar services (for example: caching, queues, observability, or other MCP-related integrations)

## Additional Consideration

Using the OmniTools image through a minimal `docker-compose.yml` may be valuable even beyond replacing the submodule. It creates a clean path to add more containers over time without redesigning the runtime model, which can simplify future expansion of the MCP server ecosystem.

## Discovery Findings (2026-03-08)

- An official OmniTools Docker image appears to exist and is referenced in the upstream project as `iib0011/omni-tools:latest`
- The upstream OmniTools project documents both `docker run` and `docker-compose` usage for self-hosting
- The upstream `omni-tools` repository includes a `Dockerfile` that builds static assets and serves via `nginx`, which indicates a web app container rather than an MCP-specific API container
- In this MCP repository, runtime tool execution currently uses local TypeScript tool definitions (`src/tools/*` via `ToolRegistry`) and does not currently invoke the `src/lib/omni-tools` submodule at execution time
- This means submodule removal is more of a repository/dependency-management cleanup today than a runtime architecture migration

## Live Runtime Validation (existing local Docker instance)

- Validated against running container: `iib0011/omni-tools:latest` on `http://127.0.0.1:8080`
- Root endpoint (`/`) returns `200` from `nginx` with `Content-Type: text/html`
- API-like paths (`/api`, `/api/health`, `/openapi.json`, `/graphql`) also return `200`, but they all return the same HTML payload as `/`
- Matching response hashes across those paths indicate SPA fallback routing (`try_files ... /index.html`) rather than a callable backend API
- Conclusion from live probe: current container is suitable for hosting OmniTools UI, but does not provide an immediately usable MCP-facing API contract

## Viability Assessment

### What looks positive

- The Docker image and Compose path align with the goal of simpler bootstrap and future multi-container extensibility
- Your idea of a Compose-first baseline is strong for future expansion (additional sidecars for persistence, queues, observability, etc.)

### What is unclear / risky

- There is no evidence yet of an official, stable OmniTools backend API contract suitable for MCP-to-OmniTools tool invocation
- If OmniTools is delivered mainly as a browser app container, a direct `omni_bridge` migration to HTTP calls may require a new compatibility layer or upstream API support
- Docker availability becomes a hard runtime prerequisite for anyone using the containerized path

## Recommendation

Proceed with a Docker-first architecture, but execute in staged increments so the MCP surface remains stable while integration contracts are introduced.

## Target Architecture

### Services

- `mcp-server`: This repository. Owns MCP protocol endpoints, tool discovery, authorization rules, and dispatch routing
- `omni-tools-ui`: Upstream OmniTools container (`iib0011/omni-tools`) exposed for manual user workflows
- `omni-adapter` (new): Thin API service that translates MCP tool calls to deterministic OmniTools-compatible operations
- Optional future sidecars: `it-tools-ui`, caching, queues, observability, persistence

### Runtime Pattern

1. Client calls MCP `omni_search` / `omni_run`
2. `mcp-server` routes call to local registry or adapter-backed registry entries
3. `omni-adapter` executes supported operations and returns normalized responses
4. MCP server returns consistent JSON result schema to clients

### Why this model

- Keeps UIs available for manual users
- Preserves loose coupling and license boundaries for external components
- Lets MCP evolve independently from upstream UI releases

## Implementation Plan

### Phase 0: Foundations (non-breaking)

- Add a versioned `docker-compose` baseline for multi-service local deployment
- Keep submodule path intact temporarily while Docker path is introduced
- Add env-driven backend selection in MCP config (for example: `OMNI_BACKEND=local|adapter`)
- Document service contracts and networking assumptions

Deliverables:
- `docker-compose.yml` with at least `mcp-server` and `omni-tools-ui`
- `.env.example` additions for adapter/base URL configuration
- Documentation update in `README.md` for Compose startup and service topology

### Phase 1: Adapter Contract (new service)

- Define minimal HTTP contract for adapter:
- `GET /health`
- `POST /tools/search`
- `POST /tools/run`
- Implement canonical request/response schema aligned with MCP output expectations
- Add timeout and error normalization policy (4xx for validation, 5xx for execution)

Deliverables:
- `docs/` contract spec (inputs, outputs, errors)
- Adapter service scaffold with health check and 2-3 initial tools
- Contract tests proving schema stability

### Phase 2: MCP Integration

- Add adapter-backed registry provider in `mcp-server`
- Keep existing local tool registry as fallback during migration window
- Feature-flag backend selection by environment variable
- Ensure `omni_search` and `omni_run` behavior remains backward compatible for MCP clients

Deliverables:
- Integration code path for adapter transport
- Unit/integration tests for both `local` and `adapter` modes
- Updated catalog output that identifies tool source when useful

### Phase 3: Migration and Hardening

- Migrate selected tools from local-only implementation to adapter-backed execution
- Benchmark latency, reliability, and timeout behavior under representative workloads
- Add structured logs/metrics for dispatch path, execution duration, and failure types
- Add resilience patterns: retries where safe, circuit-breaker behavior, graceful degradation

Deliverables:
- Performance report (baseline local vs adapter)
- Operational playbook (health checks, restart strategy, troubleshooting)
- CI checks for Compose health and adapter integration tests

### Phase 4: Submodule Decommissioning

- Remove `src/lib/omni-tools` submodule only after acceptance gates pass
- Remove submodule update scripts and related setup steps
- Update CI/release workflows to no longer require submodule checkout

Exit criteria:
- Adapter mode is default and stable
- Tool coverage meets agreed threshold
- No regressions in MCP client behavior across supported platforms

## Acceptance Criteria

- MCP clients can use `omni_search`/`omni_run` without behavior regressions when `OMNI_BACKEND=adapter`
- `docker-compose up` starts all required services reliably on Linux/macOS/Windows
- Manual UI access to OmniTools remains available while MCP integration runs
- Adapter contract is versioned and validated by automated tests
- Observability includes per-call latency and failure reason across dispatch paths
- Submodule can be removed without breaking build, tests, or runtime startup

## Risks and Mitigations

- No upstream API parity with required operations
- Mitigation: adapter owns deterministic implementations and does not depend on undocumented UI internals
- Added operational complexity from multi-service runtime
- Mitigation: Compose profiles, health checks, and concise runbooks
- Licensing/compliance confusion when mixing external components
- Mitigation: keep components isolated, track image versions/licenses, and avoid direct code vendoring
- Latency overhead from network hop
- Mitigation: local network deployment, bounded timeouts, and targeted caching

## Open Decisions

- Adapter language/runtime choice (Node/TS likely for consistency)
- Initial tool subset to migrate first (recommend low-risk text/data transforms)
- Versioning strategy for adapter API (`v1` path prefix or header)
- Minimum tool coverage required before submodule removal

## Next Steps (Execution Order)

1. Create architecture ADR for Docker + adapter boundary
2. Add `docker-compose.yml` baseline and docs
3. Implement adapter `health/search/run` contract
4. Wire MCP server backend toggle and integration tests
5. Run benchmark + reliability validation
6. Remove submodule path and cleanup scripts

## Status

Planned for implementation (Docker-first with adapter bridge)
