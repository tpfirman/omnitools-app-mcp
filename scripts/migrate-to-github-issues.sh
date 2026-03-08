#!/usr/bin/env bash
# migrate-to-github-issues.sh
#
# Creates all labels, milestones, and issues for the docs/plans → GitHub Issues migration.
# Run this locally with `gh` authenticated against tpfirman/omnitools-app-mcp.
#
# Usage:
#   chmod +x scripts/migrate-to-github-issues.sh
#   ./scripts/migrate-to-github-issues.sh
#
# Prerequisites:
#   gh auth login  (or GH_TOKEN env var with repo scope)

set -euo pipefail

REPO="tpfirman/omnitools-app-mcp"

echo "=== Creating labels ==="

gh label create "bug" \
  --repo "$REPO" \
  --description "Something isn't working" \
  --color "d73a4a" \
  --force

gh label create "feature" \
  --repo "$REPO" \
  --description "New feature or request" \
  --color "0075ca" \
  --force

gh label create "documentation" \
  --repo "$REPO" \
  --description "Documentation improvements" \
  --color "0052cc" \
  --force

echo "=== Creating milestones ==="

# Closed milestones (phases already complete)
for TITLE in \
  "Phase 1: Base Server" \
  "Phase 2: Core Porting" \
  "Phase 3: Media Integration" \
  "Phase 4: Dynamic Dispatcher"
do
  gh api repos/"$REPO"/milestones \
    --method POST \
    --field title="$TITLE" \
    --field state="closed" \
    --field description="Completed phase — see docs/plans/initial-plan.md for full spec." \
    2>/dev/null && echo "Created milestone: $TITLE" || echo "Skipped (may already exist): $TITLE"
done

# Open milestone
gh api repos/"$REPO"/milestones \
  --method POST \
  --field title="Phase 5: Client Validation" \
  --field state="open" \
  --field description="End-to-end validation with Claude Desktop, LM Studio, and other MCP clients." \
  2>/dev/null && echo "Created milestone: Phase 5: Client Validation" || echo "Skipped (may already exist): Phase 5: Client Validation"

echo "=== Fetching milestone numbers ==="

get_milestone_number() {
  gh api repos/"$REPO"/milestones --jq ".[] | select(.title == \"$1\") | .number"
}

MS_PHASE1=$(get_milestone_number "Phase 1: Base Server")
MS_PHASE5=$(get_milestone_number "Phase 5: Client Validation")

echo "Phase 1 milestone: $MS_PHASE1"
echo "Phase 5 milestone: $MS_PHASE5"

echo "=== Creating bug issues (from ISSUES_LOG.md) ==="

# ISSUE-001
ISSUE_NUM=$(gh issue create \
  --repo "$REPO" \
  --title "[ISSUE-001] Establish structured issue tracking" \
  --label "bug" \
  --milestone "$MS_PHASE1" \
  --body "**Date:** 2026-03-07
**Phase:** Phase 0 (Planning)
**Component:** Documentation

## Problem
Need a systematic way to track issues and solutions for AI agent reference.

## Context
- Working on initial project setup
- Want short-term issue tracking before GitHub issues
- Need reference for AI agents working on the project

## Solution
Created \`ISSUES_LOG.md\` in project root with structured format.

## Prevention
Migrated from \`docs/ISSUES_LOG.md\` to GitHub Issues. Agents should now open GitHub Issues with the \`bug\` label (see \`.instructions.md\`)." \
  --json number --jq ".number")
gh issue close "$ISSUE_NUM" --repo "$REPO"
echo "Created and closed issue #$ISSUE_NUM: ISSUE-001"

# ISSUE-002
ISSUE_NUM=$(gh issue create \
  --repo "$REPO" \
  --title "[ISSUE-002] TypeScript env typing mismatch in strict mode" \
  --label "bug" \
  --milestone "$MS_PHASE1" \
  --body "**Date:** 2026-03-07
**Phase:** Phase 1 (Base Server)
**Component:** \`src/config.ts\`

## Problem
TypeScript build failed because \`process.env\` contains \`string | undefined\` values and was being merged into \`Record<string, string>\`.

## Context
- Build command: \`npm run build\`
- Error: \`TS2322: Type '{ [x: string]: string | undefined; }' is not assignable to type 'Record<string, string>'\`

## Solution
Filtered \`process.env\` entries to include only defined values before merging into configuration object.

## Prevention
When using strict typing with environment variables, normalize and validate values before assignment to strongly typed records." \
  --json number --jq ".number")
gh issue close "$ISSUE_NUM" --repo "$REPO"
echo "Created and closed issue #$ISSUE_NUM: ISSUE-002"

# ISSUE-003
ISSUE_NUM=$(gh issue create \
  --repo "$REPO" \
  --title "[ISSUE-003] ESLint no-var-requires violation in validation utility" \
  --label "bug" \
  --milestone "$MS_PHASE1" \
  --body "**Date:** 2026-03-07
**Phase:** Phase 1 (Base Server)
**Component:** \`src/utils/validation.ts\`

## Problem
Linting failed due to dynamic \`require('fs')\` usage inside a function.

## Context
- Lint command: \`npm run lint\`
- Error: \`@typescript-eslint/no-var-requires\`

## Solution
Replaced inline \`require\` with top-level ESM import: \`import { existsSync } from 'fs';\`.

## Prevention
Use top-level ESM imports consistently in TypeScript modules to avoid lint failures and keep module style uniform." \
  --json number --jq ".number")
gh issue close "$ISSUE_NUM" --repo "$REPO"
echo "Created and closed issue #$ISSUE_NUM: ISSUE-003"

# ISSUE-004
ISSUE_NUM=$(gh issue create \
  --repo "$REPO" \
  --title "[ISSUE-004] Build failure after adding omni-tools submodule" \
  --label "bug" \
  --milestone "$MS_PHASE1" \
  --body "**Date:** 2026-03-07
**Phase:** Phase 1 (Base Server)
**Component:** \`tsconfig.json\`

## Problem
TypeScript attempted to compile files inside \`src/lib/omni-tools\`, causing hundreds of JSX/module resolution errors unrelated to this MCP server.

## Context
- Triggered after adding git submodule at \`src/lib/omni-tools\`
- Build command: \`npm run build\`
- Errors included: \`TS17004 Cannot use JSX unless the '--jsx' flag is provided\` and many missing module errors from the submodule frontend code

## Solution
Updated \`tsconfig.json\` to exclude \`src/lib/omni-tools\` from compilation scope.

## Prevention
When vendoring/submoduling external code under \`src/\`, explicitly exclude it from local compiler/linter scopes unless intentionally building that external project." \
  --json number --jq ".number")
gh issue close "$ISSUE_NUM" --repo "$REPO"
echo "Created and closed issue #$ISSUE_NUM: ISSUE-004"

echo "=== Creating feature issues (from docs/plans/features/) ==="

# feature-github-actions.md
ISSUE_NUM=$(gh issue create \
  --repo "$REPO" \
  --title "Feature: GitHub Actions CI and Branch Protection" \
  --label "feature" \
  --milestone "$MS_PHASE1" \
  --body "## Brief Description
Add CI automation with GitHub Actions to run build and test checks on pull requests to \`main\`, and configure repository branch protection so direct commits to \`main\` are blocked.

## Motivation
This improves release quality and enforces the project workflow by ensuring changes are validated before merge and that \`main\` remains stable.

## Initial Thoughts
- Add a workflow that runs on PRs targeting \`main\` and on pushes to \`dev\`
- Include \`npm ci\`, \`npm run build\`, \`npm test\` and \`npm run lint\`
- Require passing checks in branch protection for \`main\`
- Enforce PR-based merges and disable direct pushes to \`main\`

## Implemented
- Added workflow: \`.github/workflows/ci.yml\`
- Triggers on pull requests to \`main\` and pushes to \`dev\`/\`feature/**\`
- Runs in order: lint, test, build on Node 20
- Submodules are checked out recursively for future tool integration work

## Branch Protection Setup (GitHub UI)
- Branch: \`main\`
- Require a pull request before merging
- Require status checks to pass before merging
- Required check: \`Lint, Test, Build (Node 20)\`
- Optional hardening: require linear history, dismiss stale approvals, restrict who can push

_Migrated from \`docs/plans/features/feature-github-actions.md\`_" \
  --json number --jq ".number")
gh issue close "$ISSUE_NUM" --repo "$REPO"
echo "Created and closed issue #$ISSUE_NUM: GitHub Actions CI"

# feature-publishing-workflow.md
ISSUE_NUM=$(gh issue create \
  --repo "$REPO" \
  --title "Feature: Publishing Workflow and Automated Releases" \
  --label "feature" \
  --milestone "$MS_PHASE1" \
  --body "## Overview
Automated release workflow with CI/CD integration, branch protection guidelines, and semantic versioning.

## Implementation

### Branching Strategy
Implemented trunk-based development workflow:
- \`main\`: Production branch (protected)
- \`dev\`: Integration branch (protected)
- \`feature/*\`, \`bugfix/*\`, \`hotfix/*\`: Working branches from \`main\`

### Automated Release Workflow
**File:** \`.github/workflows/release.yml\`
**Trigger:** Push of version tags (e.g., \`v1.0.0\`)

Process:
1. Checkout code with submodules
2. Run full test suite
3. Build production bundle
4. Package distribution (tar.gz and zip)
5. Extract release notes from CHANGELOG.md
6. Create GitHub Release with artifacts
7. Update \`latest\` tag (for stable releases)

### Documentation
- \`CONTRIBUTING.md\`: Comprehensive contributor guide
- \`README.md\`: Updated Git Workflow and Releases sections

### Version Management
Semantic Versioning (SemVer): \`MAJOR.MINOR.PATCH\`
Tag format: \`vMAJOR.MINOR.PATCH\` (e.g., \`v1.2.3\`)

_Migrated from \`docs/plans/features/feature-publishing-workflow.md\`_" \
  --json number --jq ".number")
gh issue close "$ISSUE_NUM" --repo "$REPO"
echo "Created and closed issue #$ISSUE_NUM: Publishing Workflow"

echo "=== Creating open issues (additional migration items) ==="

# GitHub Workflow Automation & Documentation Alignment (open, assigned to tpfirman)
gh issue create \
  --repo "$REPO" \
  --title "GitHub Workflow Automation & Documentation Alignment" \
  --label "feature" \
  --milestone "$MS_PHASE5" \
  --assignee "tpfirman" \
  --body "Implement GitHub Actions workflows to enforce branch source restrictions, automate semantic releases on merge to \`main\`, and ensure CI runs correctly on \`dev\`. Update project documentation to reflect the new branching strategy, ruleset-based protections, and workflow conventions.

## GitHub Actions
- [ ] \`branch-source-check.yml\` — fail PRs into \`main\` or \`dev\` from disallowed source branches
  - \`main\` accepts: \`dev\`, \`hotfix/*\`
  - \`dev\` accepts: \`feature/*\`, \`bugfix/*\`, \`hotfix/*\`
- [ ] \`release.yml\` — on merge to \`main\`, create a GitHub Release using semantic version from \`package.json\`, PR body as release notes, with footer: \`For a full list of changes, see CHANGELOG.md\`
- [ ] \`ci.yml\` — verify CI triggers correctly on PRs to both \`main\` and \`dev\`, job name must match required status check string exactly: \`Lint, Test, Build (Node 20)\`

## Documentation
- [ ] \`.instructions.md\` — update branching strategy, remove rebase references, replace with merge-based flow
- [ ] \`README.md\` — update branch protection section to reference rulesets, remove rebase references

## Prerequisites before starting
- Rulesets for \`main\` and \`dev\` imported and active (replacing classic branch protection)
- \`CODEOWNERS\` committed to repo root
- Copilot code review availability confirmed — if unavailable, remove \`Copilot code review\` required status check from main ruleset
- Confirm \`package.json\` has a \`version\` field and will be the version source of truth
- Decide: hotfix back-merge to \`dev\` after main merge — manual or automated?"
echo "Created open issue: GitHub Workflow Automation & Documentation Alignment"

# Update documentation to reflect GitHub Issues workflow (open, assigned to tpfirman)
gh issue create \
  --repo "$REPO" \
  --title "Update documentation to reflect GitHub Issues workflow" \
  --label "documentation" \
  --milestone "$MS_PHASE5" \
  --assignee "tpfirman" \
  --body "Update \`.instructions.md\` and \`README.md\` to reflect that GitHub Issues replaces \`docs/plans/features/\` and \`docs/ISSUES_LOG.md\`.

As documented in \`.instructions.md\`:
- Agents should open GitHub Issues with the \`bug\` label instead of appending to \`docs/ISSUES_LOG.md\`
- Agents should open GitHub Issues with the \`feature\` label instead of creating files under \`docs/plans/features/\`

## Tasks
- [ ] Update \`.instructions.md\` Issue Tracking section
- [ ] Update \`.instructions.md\` Feature Planning section
- [ ] Update \`README.md\` Support section to link to GitHub Issues
- [ ] Remove any stale references to deprecated doc files

_See also: \`.instructions.md\` for full agent guidelines_"
echo "Created open issue: Update documentation to reflect GitHub Issues workflow"

echo ""
echo "=== Migration complete ==="
echo "Labels, milestones, and issues have been created in $REPO"
echo "View issues at: https://github.com/$REPO/issues"
