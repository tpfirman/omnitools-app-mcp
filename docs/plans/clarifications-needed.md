# Clarifications Needed for MCP Server Implementation

This document captures questions and decisions needed before execution can begin. Once resolved, these should be integrated into `initial-plan.md`.

---

## 1. Dependency Management: omni-tools Integration

**Question:** How will the `omni-tools` library be integrated into this project?

**Options:**
- A) Git submodule in `/src/lib/omni-tools`
- B) NPM package (published to npm registry)
- C) Local copy/clone that gets vendored
- D) Direct import as peer dependency

**Impact:** Affects package.json setup, build process, and how we import/wrap tools.

**Decision:** Git submodule in `/src/lib/omni-tools`. This provides clean separation and easy independent updates while maintaining version control.

---

## 2. Dispatcher Pattern: Search Behavior

**Question:** How should `omni_search` work exactly?

**Sub-questions:**
- What triggers search? (string query? metadata tags? category hierarchy?)
- How many results should it return? (top 5? top 10? all matches?)
- How do we rank relevance? (fuzzy match? semantic? keyword-based?)
- Should search support filtering? (e.g., by category, input type, output type?)
- Does the LLM get full tool schema or just name + brief description?

**Impact:** Affects search implementation complexity and token usage optimization.

**Decision:**
- Query type: String query (natural language), e.g., "convert PDF to images"
- Results count: Top 10 results (configurable)
- Ranking: Keyword-based matching (default), but make it configurable for future semantic improvements
- Result detail: LLM gets tool name + brief description (not full schema)

---

## 3. Configuration & Environment Setup

**Question:** What prerequisites/setup must be done before development starts?

**Sub-questions:**
- Required Node version? (e.g., 18+, 20+?)
- Required system dependencies? (FFmpeg? ImageMagick? Others?)
- Environment variables needed? (how many, what defaults?)
- Should there be a setup script (`scripts/setup.sh` or similar)?
- How do we validate all dependencies are present before the server starts?

**Impact:** Affects first-time developer experience and cross-platform compatibility.

**Decision:**
- Required Node version: Node 20 LTS
- Required system dependencies: FFmpeg (hard requirement with startup validation)
- Environment variables: Use `.env.example` with defaults; setup script validates dependencies on init
- Setup approach: Include `scripts/setup.sh` for cross-platform initialization

---

## 4. Testing & Validation Strategy

**Question:** What does success look like for Phase 5 (Testing)?

**Sub-questions:**
- Acceptance criteria? (all Phase 2 tools working? specific response time targets?)
- Test environment setup? (local testing + remote testing with Claude Desktop + LM Studio?)
- Regression testing approach?
- What's the minimum viable testing before release?

**Impact:** Defines when phases are "complete" and prevents scope creep.

**Decision:**
- Test with VSCode using LM Studio (self-hosted LLM)
- Acceptance criteria: All Phase 2 tools working end-to-end + test suite with regression coverage
- Minimum viable testing: Core tools functional before release

---

## 5. Performance & Resource Constraints

**Question:** Are there performance/resource limits to enforce?

**Sub-questions:**
- Timeout per tool execution? (default? overrideable?)
- Max file size to process? (for media/documents?)
- Memory limits?
- Should we rate-limit certain expensive operations?
- Concurrent execution limits?

**Impact:** Prevents runaway tasks and keeps the server responsive.

**Decision:**
- Default timeout: 60 seconds (configurable via `.env`)
- Rationale: Self-hosted LLMs can be slow; allow flexibility
- Max file size: 50 MB default (no hard limit, configurable)
- Concurrent execution: No hard limit initially; monitor and adjust if needed
- Rate limiting: Not required for Phase 1

---

## 6. Versioning & Compatibility

**Question:** How do we handle updates to the omni-tools library?

**Sub-questions:**
- Semantic versioning for the MCP server?
- Pin omni-tools to a specific version or track latest?
- How do breaking changes in omni-tools get handled?
- Deprecation strategy for removed/renamed tools?

**Impact:** Long-term maintainability and stability.

**Decision:**
- Track latest omni-tools version with user update prompts
- Rationale: Omni-tools is containerized; leverage that for easy updates
- Approach: Check version on startup, suggest updates if available
- Deprecation strategy: Document breaking changes in CHANGELOG

---

## 7. Error Handling & User Feedback

**Question:** What level of error detail should be returned to the LLM?

**Sub-questions:**
- Full error stack traces or user-friendly messages?
- Logging strategy? (file logs? stdout? external service?)
- How do we handle partial failures? (e.g., processing 5 files, 1 fails?)
- Should we suggest corrections for common errors?

**Impact:** Affects LLM ability to self-correct and debug issues.

**Decision:**
- Error detail to LLM: User-friendly messages with suggested fixes
- Detailed logging: Full error stack traces + context logged to file (not shown to LLM)
- Partial failures: Report which items failed with individual error messages
- Log file location: `logs/mcp-server.log` (configurable)

---

## 8. Security Considerations

**Question:** Are there security constraints for the MCP server?

**Sub-questions:**
- File access restrictions? (prevent access outside certain directories?)
- Command execution isolation? (for tools that invoke binaries?)
- Input sanitization requirements?
- Should we run in a sandbox/container?

**Impact:** Prevents misuse and protects the host system.

**Decision:**
- File access restrictions: Whitelist specific directories only
- Explanation: Maximum security; explicit allow-list approach
- Input sanitization: Sanitize file paths to prevent path traversal attacks
- Command execution: Use spawned subprocesses (inherent isolation)
- Sandbox: Not required for Phase 1; can be evaluated later

---

## 9. Project Structure Refinement

**Question:** Any adjustments needed to the proposed project structure?

**Sub-questions:**
- Where should tests live? (alongside source or separate?)
- Configuration file location? (`.env`, `config/` folder?)
- Should there be a `/examples` folder with sample MCP calls?
- Where do build artifacts go? (`/dist`, `/build`?)

**Impact:** Affects developer navigation and CI/CD setup.

**Decision:**
- Tests: `/tests` directory with unit and integration tests
- Configuration: `/config` folder for config schemas; `.env` for runtime variables
- Examples: `/examples` folder with sample MCP calls
- Build artifacts: `/dist` directory (compiled TypeScript)
- Logging: `/logs` directory (created at runtime)

---

## 10. Phase 2 Scope: "Most Stable Text and Data Tools"

**Question:** Which specific omni-tools functions should Phase 2 wrap?

**Sub-questions:**
- How many tools? (5? 10? 20?)
- Prioritization criteria? (most-used? easiest to wrap? highest value?)
- Should we start with a single category (e.g., all text tools) or mix?

**Impact:** Defines concrete deliverable for Phase 2.

**Decision:**
- Scope: 10-15 tools (mix of text, document, and basic utilities)
- Prioritization: Start with most-used + easiest to wrap tools
- Approach: Mix categories (don't limit to text-only)
- Examples to include:
  - String utilities (trim, case conversion, etc.)
  - JSON validation/formatting
  - CSV processing basics
  - Text hashing
  - Basic file operations

---
