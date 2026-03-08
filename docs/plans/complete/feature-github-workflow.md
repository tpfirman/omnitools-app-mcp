# Feature: GitHub Workflow Automation & Documentation Alignment

## Brief Description

Implement GitHub Actions workflows to enforce branch source restrictions, automate semantic releases on merge to `main`, and ensure CI runs correctly on `dev`. Update project documentation to reflect the new branching strategy, ruleset-based protections, and workflow conventions.

## Motivation

Phase 1 established a base server and a basic CI workflow. The repository branching strategy has since been formalised with rulesets, but several enforcement gaps remain that cannot be addressed through GitHub settings alone:

- There is no enforcement preventing PRs into `main` from arbitrary branches (only `dev` and `hotfix/*` should be permitted)
- There is no automated release process — releases must be created manually
- The CI workflow has not been confirmed to trigger correctly on `dev` PRs
- `CODEOWNERS`, `.instructions.md`, and `README.md` do not reflect the new ruleset-based workflow

## Scope

### GitHub Actions

#### 1. Source Branch Enforcement

A workflow that runs on PRs targeting `main` or `dev` and validates the source branch against allowed patterns. If the source branch is not permitted, the check fails and blocks the merge.

**Allowed sources for `main`:**
- `dev`
- `hotfix/*`

**Allowed sources for `dev`:**
- `feature/*`
- `bugfix/*`
- `hotfix/*`

**Implementation notes:**
- Job name must match the required status check registered in the ruleset so GitHub treats it as a gate
- Should post a clear failure message indicating which branches are permitted
- Hotfix branches targeting `main` should also be merged back into `dev` automatically after merge — consider a follow-up job or document this as a manual step initially

**Suggested workflow file:** `.github/workflows/branch-source-check.yml`

---

#### 2. Auto-Release on Merge to Main

A workflow that triggers on `push` to `main` (i.e., when a PR is merged) and automatically creates a GitHub Release.

**Requirements:**
- Versioning: semantic (`v1.2.3`) — version must be derived or specified somewhere. Options to decide:
  - Read version from `package.json` (simplest — update `package.json` as part of the PR)
  - Parse a version tag from the PR title (e.g. `[v1.2.0] Release description`)
  - Manually tag the commit before merge and trigger off the tag
  - **Recommended:** Use `package.json` version as the source of truth — it is already part of the codebase and visible in the PR diff
- Release name: derived from the PR title
- Release notes: the body of the merged PR, with the following footer appended automatically:

  ```
  ---
  For a full list of changes, see [CHANGELOG.md](./CHANGELOG.md).
  ```

- Release should be marked as latest
- Should only trigger on merge to `main`, not on direct pushes (guard with a condition checking `github.event.pull_request.merged == true` or use the `pull_request` closed event with merged filter)

**Prerequisites:**
- The workflow requires `contents: write` permission to create releases
- A `GITHUB_TOKEN` is sufficient — no PAT needed for releases on the same repo

**Suggested workflow file:** `.github/workflows/release.yml`

---

#### 3. CI Workflow Verification for Dev

The existing CI workflow (`ci.yml`) should be confirmed to trigger on:
- PRs targeting `dev`
- PRs targeting `main`
- Pushes to `dev` (optional but useful for catching direct merges)

**Check the current `on:` block in `.github/workflows/ci.yml` and update if needed.**

The job name in the workflow must exactly match the required status check string registered in the rulesets:
- `Lint, Test, Build (Node 20)`

If the job name has drifted or the trigger conditions are incomplete, update accordingly.

**Note:** If CI was previously not running on dev PRs, verify the fix works by raising a test PR into `dev` before considering this item complete.

---

### Documentation Updates

#### 4. Update `.instructions.md`

The following sections need to reflect the new workflow:

- **Git Workflow → Branching Strategy:** Update to reflect rulesets (not classic branch protection), add note that `main` only accepts PRs from `dev` or `hotfix/*`, and `dev` only accepts PRs from `feature/*`, `bugfix/*`, or `hotfix/*`
- **Git Workflow → When to Merge:** Add note that merge commits are the only permitted merge method (squash and rebase are blocked by ruleset)
- **Git Workflow → Merge Process:** Remove the rebase instruction. Replace with a merge-based flow:

  ```bash
  # Keep your branch up to date with dev
  git checkout dev
  git pull origin dev
  git checkout feature/your-feature
  git merge dev   # not rebase

  # Merge into dev via PR — do not merge locally
  # Raise a PR on GitHub; CI must pass before merge
  ```

- **Git Workflow → Commit Conventions:** No changes needed
- **References:** Add link to the new workflow files once created

#### 5. Update `README.md`

- **Git Workflow section:** Mirror the changes made to `.instructions.md` — update branching strategy description and remove rebase references
- **CI and Branch Protection section:** Update to describe rulesets instead of classic branch protection rules. Note that Copilot code review is required on PRs to `main`
- **Phase 1 Status / Next section:** No changes needed here — this is a workflow concern, not a phase concern

---

## Prerequisites

Before implementation, confirm the following manually:

- [ ] Rulesets for `main` and `dev` have been imported and are active (replacing classic branch protection rules)
- [ ] `CODEOWNERS` file has been committed to the repo root or `.github/` directory
- [ ] Copilot code review availability confirmed for your GitHub plan — if unavailable, the `Copilot code review` required status check in the `main` ruleset must be removed to avoid permanently blocking PRs
- [ ] `package.json` has a `version` field — confirm this will be the source of truth for release versioning

---

## Acceptance Criteria

- [ ] A PR from a disallowed branch into `main` or `dev` fails the source branch check and cannot be merged
- [ ] A PR from an allowed branch into `main` or `dev` passes the source branch check
- [ ] CI runs and is required on PRs targeting both `main` and `dev`
- [ ] Merging a PR into `main` automatically creates a GitHub Release with correct semantic version, PR body as release notes, and CHANGELOG footer
- [ ] Release is marked as latest
- [ ] `.instructions.md` merge process section no longer references rebase
- [ ] `README.md` branch protection section references rulesets, not classic rules
- [ ] All documentation references to branching strategy match the implemented ruleset configuration

---

## Potential Challenges

- **Hotfix back-merge to dev:** After a hotfix merges to `main`, `dev` will be behind. This needs to either be automated (a workflow that opens a PR from `main` → `dev` after a hotfix merge) or documented as a required manual step. Recommend manual initially, with automation as a follow-up feature.
- **Version source of truth:** If `package.json` version is not updated as part of the PR, the release will tag the wrong version. A workflow validation step that checks the version has been bumped (i.e., differs from the latest tag) would catch this.
- **Copilot review availability:** If Copilot code review is not available on the current plan, the required check in the main ruleset will permanently block all PRs. This must be resolved before the ruleset goes live.

---

## Related Files

- `.github/workflows/ci.yml` — existing, needs verification
- `.github/workflows/branch-source-check.yml` — new
- `.github/workflows/release.yml` — new
- `CODEOWNERS` — new (already drafted, needs committing)
- `.instructions.md` — update
- `README.md` — update

---

## Status

Complete
