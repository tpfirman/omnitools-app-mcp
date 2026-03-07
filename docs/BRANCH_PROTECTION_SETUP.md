# Branch Protection Setup

## Overview

Branch protection rules must be configured manually through GitHub's web interface, as the GitHub MCP tools do not currently support the branch protection API.

## Why Manual Setup?

The available GitHub MCP tools include:
- `mcp_github_create_branch`
- `mcp_github_create_pull_request`
- `mcp_github_issue_write`
- `mcp_github_create_or_update_file`
- etc.

But **do not include** repository settings or branch protection management.

## Setup Instructions

### Protecting the `main` Branch

1. Navigate to repository settings:
   ```
   https://github.com/tpfirman/omnitools-app-mcp/settings/branches
   ```

2. Click **"Add rule"** or edit existing rule for `main`

3. Configure the following settings:

   **Branch name pattern:**
   ```
   main
   ```

   **Protection rules:**
   - ✅ **Require a pull request before merging**
     - Required number of approvals: **1**
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners (if CODEOWNERS file exists)
   
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - **Status checks that are required:**
       - `Lint, Test, Build (20.x)`
   
   - ✅ **Require conversation resolution before merging**
   
   - ✅ **Do not allow bypassing the above settings**
   
   - ✅ **Restrict who can push to matching branches**
     - Select: Maintainers only (or specific users/teams)
   
   - ✅ **Do not allow force pushes**
   
   - ✅ **Do not allow deletions**

4. Click **"Create"** or **"Save changes"**

### Protecting the `dev` Branch

1. Click **"Add rule"** for `dev`

2. Configure the following settings:

   **Branch name pattern:**
   ```
   dev
   ```

   **Protection rules:**
   - ✅ **Require status checks to pass before merging**
     - Status checks: `Lint, Test, Build (20.x)`
   
   - ✅ **Require linear history** (optional - prevents merge commits)
   
   - ⚠️ **Allow force pushes** only for administrators (rare emergency cases)

3. Click **"Create"**

## Verification

### Via GitHub CLI

```bash
# Check main branch protection
gh api repos/tpfirman/omnitools-app-mcp/branches/main/protection

# Check dev branch protection
gh api repos/tpfirman/omnitools-app-mcp/branches/dev/protection
```

### Via Web Interface

Visit: https://github.com/tpfirman/omnitools-app-mcp/settings/branch_protection_rules

You should see protection rules listed for:
- `main`
- `dev`

## Testing Protection Rules

### Test `main` Protection

```bash
# This should fail (direct push blocked)
git checkout main
git push origin main
# Error: The `main` branch requires a pull request before merging

# This should work (PR workflow)
git checkout -b test/protection-test
git push -u origin test/protection-test
# Then create PR via GitHub: test/protection-test → main
```

### Test `dev` Protection

```bash
# Direct push should fail if CI hasn't run
git checkout dev
echo "test" >> test.txt
git add test.txt
git commit -m "test: verify protection"
git push origin dev
# Should be blocked until PR with passing CI is created
```

## Enforcement

With these rules in place:

1. **All work** must be done in feature branches from `main`
2. **All features** must PR into `dev` (not `main`)
3. **Releases** require PR from `dev` → `main`
4. **CI must pass** before any merge
5. **Code review required** for merges to `main`
6. **No force pushes** to `main` or `dev`

## Future Automation

If GitHub MCP tools add branch protection support in the future, we can script this with:

```typescript
// Hypothetical future API
await mcp_github_update_branch_protection({
  owner: 'tpfirman',
  repo: 'omnitools-app-mcp',
  branch: 'main',
  protection: {
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true
    },
    required_status_checks: {
      strict: true,
      contexts: ['Lint, Test, Build (20.x)']
    },
    enforce_admins: true,
    restrictions: null
  }
});
```

Until then, manual setup via GitHub UI is required.

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub REST API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
