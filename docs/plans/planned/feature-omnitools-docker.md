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

## Status

Idea
