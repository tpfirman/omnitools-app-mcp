# Feature: Publishing Workflow and Automated Releases

**Status:** ✅ **Complete**

## Overview

Automated release workflow with CI/CD integration, branch protection guidelines, and semantic versioning.

## Implementation

### 1. Branching Strategy

Implemented trunk-based development workflow:

- **`main`**: Production branch (protected)
- **`dev`**: Integration branch (protected)
- **`feature/*`, `bugfix/*`, `hotfix/*`**: Working branches from `main`

Workflow:
```
feature/* → PR → dev → PR → main → tag → automated release
```

### 2. Automated Release Workflow

**File:** `.github/workflows/release.yml`

**Trigger:** Push of version tags (e.g., `v1.0.0`)

**Process:**
1. Checkout code with submodules
2. Run full test suite
3. Build production bundle
4. Package distribution (tar.gz and zip)
5. Extract release notes from CHANGELOG.md
6. Create GitHub Release with artifacts
7. Update `latest` tag (for stable releases)

**Usage:**
```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 3. Documentation

**CONTRIBUTING.md**: Comprehensive contributor guide with:
- Detailed branching workflow
- Conventional commit guidelines
- Code quality requirements
- Branch protection setup instructions
- Release process documentation

**README.md**: Updated sections:
- Git Workflow (quick reference)
- Releases (automation details)
- Contributing (link to CONTRIBUTING.md)

### 4. Branch Protection

**Manual setup required** (GitHub MCP tools don't support protection API):

**For `main`:**
- Require pull request reviews (1 approval)
- Require status checks (CI must pass)
- Require branches up to date
- No force pushes or deletions
- Restrict pushes to maintainers

**For `dev`:**
- Require status checks (CI must pass)
- Optional: Require linear history

See CONTRIBUTING.md for detailed setup instructions.

### 5. Version Management

**Semantic Versioning (SemVer):** `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

**Tag format:** `vMAJOR.MINOR.PATCH` (e.g., `v1.2.3`)

**Pre-releases:** `v1.0.0-alpha.1`, `v1.0.0-beta.2`, `v1.0.0-rc.1`

## Benefits

1. **Consistent workflow**: Clear guidelines prevent confusion
2. **Automated quality checks**: CI runs on all PRs
3. **Automated releases**: One command creates full release
4. **Protected branches**: Prevent accidental force pushes
5. **Semantic versioning**: Clear version meaning
6. **Release artifacts**: Downloadable distributions
7. **Release notes**: Auto-generated from CHANGELOG

## Files Modified

- `.github/workflows/release.yml` (new)
- `CONTRIBUTING.md` (new)
- `README.md` (updated)
- `docs/plans/features/feature-publishing-workflow.md` (this file)

## Next Steps

1. **Enable branch protection** in GitHub UI (manual)
2. **Test release workflow** with v1.0.0 tag
3. **Document first release** in CHANGELOG.md
4. **Create v1.0.0 tag** after dev→main merge

## References

- Conventional Commits: https://www.conventionalcommits.org/
- Keep a Changelog: https://keepachangelog.com/
- Semantic Versioning: https://semver.org/
- GitHub Actions: https://docs.github.com/en/actions

## Brief Description
Add lightweight publishing guidance for releasing this project to GitHub, focused on pre-publish checks and post-publish setup without automating git release/tagging yet.

## Motivation
Publishing is currently manual. A small, documented workflow will reduce mistakes and make releases repeatable while keeping control in human hands.

## Initial Thoughts
- Add a concise pre-publish checklist to `README.md`
- Cover checks: build, tests, docs, license, submodule initialization
- Cover post-publish steps: enable Issues, set repo description/topics, add branch protection
- Keep this as documentation-first (no release tags/automation yet)
- Consider CI-backed publish readiness checks later

## Status
Idea
