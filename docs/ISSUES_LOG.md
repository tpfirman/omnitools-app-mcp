# Issues & Solutions Log

This document tracks problems encountered during development and their solutions. Use this as a reference when debugging similar issues.

---

## Format

Each entry should follow this structure:

```markdown
### [ISSUE-XXX] Brief Description
**Date:** YYYY-MM-DD
**Phase:** Phase X
**Component:** (e.g., server.ts, dispatcher, tests)
**Status:** Open | In Progress | Resolved

**Problem:**
Clear description of the issue

**Context:**
- Relevant environment details
- Steps to reproduce
- Error messages/stack traces

**Solution:**
How it was resolved (or current investigation status)

**Prevention:**
How to avoid this in the future (tests added, documentation updated, etc.)

---
```

## Issues Registry

### [ISSUE-001] Template Entry
**Date:** 2026-03-07
**Phase:** Phase 0 (Planning)
**Component:** Documentation
**Status:** Resolved

**Problem:**
Need a systematic way to track issues and solutions for AI agent reference.

**Context:**
- Working on initial project setup
- Want short-term issue tracking before GitHub issues
- Need reference for AI agents working on the project

**Solution:**
Created this ISSUES_LOG.md in project root with structured format.

**Prevention:**
Document all significant issues here. Migrate to GitHub Issues when project is published.

---

### [ISSUE-002] TypeScript env typing mismatch in strict mode
**Date:** 2026-03-07
**Phase:** Phase 1 (Base Server)
**Component:** `src/config.ts`
**Status:** Resolved

**Problem:**
TypeScript build failed because `process.env` contains `string | undefined` values and was being merged into `Record<string, string>`.

**Context:**
- Build command: `npm run build`
- Error: `TS2322: Type '{ [x: string]: string | undefined; }' is not assignable to type 'Record<string, string>'`

**Solution:**
Filtered `process.env` entries to include only defined values before merging into configuration object.

**Prevention:**
When using strict typing with environment variables, normalize and validate values before assignment to strongly typed records.

---

### [ISSUE-003] ESLint no-var-requires violation in validation utility
**Date:** 2026-03-07
**Phase:** Phase 1 (Base Server)
**Component:** `src/utils/validation.ts`
**Status:** Resolved

**Problem:**
Linting failed due to dynamic `require('fs')` usage inside a function.

**Context:**
- Lint command: `npm run lint`
- Error: `@typescript-eslint/no-var-requires`

**Solution:**
Replaced inline `require` with top-level ESM import: `import { existsSync } from 'fs';`.

**Prevention:**
Use top-level ESM imports consistently in TypeScript modules to avoid lint failures and keep module style uniform.

---

### [ISSUE-004] Build failure after adding omni-tools submodule
**Date:** 2026-03-07
**Phase:** Phase 1 (Base Server)
**Component:** `tsconfig.json`
**Status:** Resolved

**Problem:**
TypeScript attempted to compile files inside `src/lib/omni-tools`, causing hundreds of JSX/module resolution errors unrelated to this MCP server.

**Context:**
- Triggered after adding git submodule at `src/lib/omni-tools`
- Build command: `npm run build`
- Errors included: `TS17004 Cannot use JSX unless the '--jsx' flag is provided` and many missing module errors from the submodule frontend code

**Solution:**
Updated `tsconfig.json` to exclude `src/lib/omni-tools` from compilation scope.

**Prevention:**
When vendoring/submoduling external code under `src/`, explicitly exclude it from local compiler/linter scopes unless intentionally building that external project.

---
