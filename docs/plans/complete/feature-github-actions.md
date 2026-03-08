# Feature: GitHub Actions CI and Branch Protection

## Brief Description
Add CI automation with GitHub Actions to run build and test checks on pull requests to `main`, and configure repository branch protection so direct commits to `main` are blocked.

## Motivation
This improves release quality and enforces the project workflow by ensuring changes are validated before merge and that `main` remains stable.

## Initial Thoughts
- Add a workflow that runs on PRs targeting `main` and on pushes to `dev`
- Include `npm ci`, `npm run build`, `npm test` and `npm run lint`
- Require passing checks in branch protection for `main`
- Enforce PR-based merges and disable direct pushes to `main`

## Implemented
- Added workflow: `.github/workflows/ci.yml`
- Triggers on pull requests to `main` and pushes to `dev`/`feature/**`
- Runs in order: lint, test, build on Node 20
- Submodules are checked out recursively for future tool integration work

## Branch Protection Setup (GitHub UI)
- Branch: `main`
- Require a pull request before merging
- Require status checks to pass before merging
- Required check: `Lint, Test, Build (Node 20)`
- Optional hardening: require linear history, dismiss stale approvals, restrict who can push

## Status
Complete