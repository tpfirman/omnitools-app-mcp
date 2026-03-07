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

## Status
Idea