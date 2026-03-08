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

Progress this feature in phases, but do not commit to full submodule replacement yet.

1. Keep this as a discovery-driven initiative until API compatibility is proven
2. Add an optional `docker-compose` profile as an experimentation path (non-breaking)
3. Confirm a callable API surface for the required tools
4. Prototype `omni_search`/`omni_run` against the container
5. Measure latency and reliability versus current local execution
6. Only then decide whether to deprecate the submodule

## Status

Discovery complete (recommend phased prototype)
