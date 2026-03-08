# Repository Rulesets Setup

## Overview

Repository rulesets must be configured manually through GitHub's web interface, as the GitHub MCP tools do not currently support ruleset APIs.

## Why Manual Setup?

The available GitHub MCP tools include:
- `mcp_github_create_branch`
- `mcp_github_create_pull_request`
- `mcp_github_issue_write`
- `mcp_github_create_or_update_file`
- etc.

But they do not include repository settings or ruleset management.

## Setup Instructions

### Ruleset for `main`

1. Navigate to repository rulesets:
   ```
   https://github.com/tpfirman/omnitools-app-mcp/settings/rules
   ```
2. Click `New ruleset` (or edit existing) and target branch `main`.
3. Configure:
   - Require a pull request before merging.
   - Required number of approvals: `1`.
   - Dismiss stale pull request approvals when new commits are pushed.
   - Require review from Code Owners (if `CODEOWNERS` exists).
   - Require status checks to pass before merging.
   - Require branches to be up to date before merging.
   - Required status check: `Lint, Test, Build (Node 20)`.
   - Require conversation resolution before merging.
   - Restrict who can push to matching branches.
   - Do not allow force pushes.
   - Do not allow deletions.
4. Save and enable the ruleset.

### Ruleset for `dev`

1. In the same rulesets page, create or edit a ruleset targeting branch `dev`.
2. Configure:
   - Require status checks to pass before merging.
   - Required status check: `Lint, Test, Build (Node 20)`.
   - Require linear history (optional).
3. Save and enable the ruleset.

## Verification

### Via GitHub UI

Visit `https://github.com/tpfirman/omnitools-app-mcp/settings/rules` and confirm active rulesets for:
- `main`
- `dev`

### Via CLI (classic protection endpoint)

```bash
# Classic endpoint can still show branch protection data where applicable
gh api repos/tpfirman/omnitools-app-mcp/branches/main/protection
gh api repos/tpfirman/omnitools-app-mcp/branches/dev/protection
```

## Testing Ruleset Enforcement

### Test `main`

```bash
# This should fail (direct push blocked)
git checkout main
git push origin main

# This should work (PR workflow)
git checkout -b test/protection-test
git push -u origin test/protection-test
# Then create PR: test/protection-test -> main
```

### Test `dev`

```bash
# Direct push should be blocked by ruleset settings
git checkout dev
echo "test" >> test.txt
git add test.txt
git commit -m "test: verify ruleset"
git push origin dev
```

## Enforcement Summary

With these rulesets in place:
1. All work is done in feature branches from `main`.
2. Features PR into `dev`.
3. Releases happen by merging `dev` into `main`.
4. CI must pass before any merge.
5. Code review is required for merges to `main`.
6. Force pushes are blocked on protected branches.

## References

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub REST API - Repository Rules](https://docs.github.com/en/rest/repos/rules)
