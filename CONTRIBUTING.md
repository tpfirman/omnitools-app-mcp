# Contributing to OmniTools MCP Server

Thank you for your interest in contributing! This document outlines our development workflow and contribution guidelines.

## Branching Strategy

This project follows a **trunk-based development** workflow with the following structure:

```
main (production)
  ↑
  PR (when ready to release)
  ↑
dev (integration)
  ↑
  PR (for all features)
  ↑
feature/*, bugfix/*, hotfix/* (working branches)
```

### Workflow Steps

#### 1. **Sync Your Local Repository**

Before creating any new branch, **always** ensure your local `main` and `dev` branches are up to date:

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Switch to dev and pull latest
git checkout dev
git pull origin dev
```

#### 2. **Create a Branch from Main**

All new work must branch from `main` (not `dev`):

```bash
# Create and checkout a new branch from main
git checkout main
git checkout -b feature/my-feature-name

# Or for bug fixes
git checkout -b bugfix/issue-123

# Or for hotfixes
git checkout -b hotfix/critical-fix
```

**Branch naming conventions:**
- `feature/*` - New features or enhancements
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `docs/*` - Documentation-only changes
- `chore/*` - Maintenance tasks

#### 3. **Work on Your Branch**

```bash
# Make your changes
# ...

# Stage and commit with conventional commits
git add .
git commit -m "feat: add new tool for data processing"

# Push your branch
git push -u origin feature/my-feature-name
```

#### 4. **Create a Pull Request into Dev**

Once your feature is complete:

1. Push your branch to GitHub
2. Open a pull request **targeting `dev`** (not `main`)
3. Fill out the PR template
4. Wait for CI checks to pass
5. Request review from maintainers

#### 5. **Release Process (Dev → Main)**

When `dev` is ready for a new release:

1. Ensure all feature PRs are merged into `dev`
2. Create a PR from `dev` → `main`:
   ```bash
   # On GitHub, create PR: dev → main
   # Title: "Release v1.x.x"
   ```
3. Wait for CI checks and approval
4. Merge the PR into `main`
5. Create a release (see below)

### Automated Release Creation

After merging `dev` into `main`, a release can be created automatically:

```bash
# On the main branch, create and push a version tag
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

The GitHub Actions workflow will automatically:
- Build the project
- Generate release notes
- Create a GitHub Release
- Attach build artifacts

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear and semantic commit messages:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks
- `refactor:` - Code restructuring
- `perf:` - Performance improvements
- `style:` - Code style/formatting
- `ci:` - CI/CD changes

### Examples

```bash
# New feature
git commit -m "feat(tools): add CSV validation tool"

# Bug fix
git commit -m "fix(config): handle undefined environment variables"

# Documentation
git commit -m "docs: update branching workflow in CONTRIBUTING.md"

# Breaking change
git commit -m "feat(api)!: change tool registry interface

BREAKING CHANGE: ToolRegistry.search() now returns SearchResult[]"
```

## Development Guidelines

### Before You Start

1. **Check existing issues** - See if someone is already working on it
2. **Create an issue** - Discuss major changes before implementing
3. **Sync your branches** - Always pull latest from `main` and `dev`

### Code Quality

All pull requests must pass:

- ✅ Linting (`npm run lint`)
- ✅ Tests (`npm test`)
- ✅ Build (`npm run build`)

Run the full quality check locally:

```bash
npm run lint && npm test -- --runInBand && npm run build
```

### Writing Tests

- Write unit tests for new tools in `tests/unit/`
- Include integration tests for complex workflows
- Aim for >80% coverage on new code

Example test structure:

```typescript
describe('ToolName', () => {
  it('should perform expected behavior', () => {
    // Arrange
    const input = { /* ... */ };
    
    // Act
    const result = toolFunction(input);
    
    // Assert
    expect(result).toEqual(expectedOutput);
  });
});
```

### Documentation

- Update README.md if adding new features
- Document new tools in `docs/tools/`
- Add examples to `examples/` directory
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/)

## Branch Protection Rules

The `main` branch should be protected with the following rules:

1. **Require pull request reviews** (1 approval minimum)
2. **Require status checks** (CI must pass)
3. **Require branches to be up to date** before merging
4. **Do not allow force pushes**
5. **Do not allow deletions**

The `dev` branch should be protected with:

1. **Require status checks** (CI must pass)
2. **Allow force pushes** only from administrators (for rare cases)

See **Branch Protection Setup** section below for instructions.

## Repository Setup

### Initial Clone

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/tpfirman/omnitools-app-mcp.git
cd omnitools-app-mcp

# Or if already cloned
git submodule update --init --recursive

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run tests
npm test

# Build
npm run build
```

### Keeping Submodules Updated

```bash
# Update to pinned commits
npm run submodules:update

# Update to latest remote versions
npm run submodules:update:remote
```

## CI/CD Pipeline

Our CI/CD runs on:
- Pull requests to `main`
- Pushes to `dev` or `feature/**` branches

### CI Workflow Stages

1. **Checkout** - Fetch code with submodules
2. **Setup** - Install Node.js 20 and dependencies
3. **Lint** - Run ESLint checks
4. **Test** - Run Jest test suite
5. **Build** - Compile TypeScript

### Release Workflow

Triggered on version tags (`v*.*.*`):

1. **Build** - Compile production bundle
2. **Test** - Run full test suite
3. **Package** - Create distribution artifacts
4. **Release** - Generate release notes and publish

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/tpfirman/omnitools-app-mcp/discussions)
- **Bug reports?** Create an [issue](https://github.com/tpfirman/omnitools-app-mcp/issues)
- **Security issues?** Email maintainers (see README)

## Code of Conduct

- Be respectful and inclusive
- Assume positive intent
- Accept constructive feedback
- Focus on what's best for the project

---

## Branch Protection Setup

Since GitHub MCP tools don't currently support branch protection API, these must be configured manually via GitHub UI:

### Protecting `main` Branch

1. Go to **Settings** → **Branches**
2. Click **Add rule** or edit existing rule for `main`
3. Configure:
   - **Branch name pattern:** `main`
   - ✅ **Require a pull request before merging**
     - Required approvals: 1
     - ✅ Dismiss stale reviews when new commits are pushed
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Status checks: `Lint, Test, Build (20.x)`
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Restrict who can push to matching branches** (optional - maintainers only)
4. Click **Create** or **Save changes**

### Protecting `dev` Branch

1. Go to **Settings** → **Branches**
2. Click **Add rule** for `dev`
3. Configure:
   - **Branch name pattern:** `dev`
   - ✅ **Require status checks to pass before merging**
     - Status checks: `Lint, Test, Build (20.x)`
   - ✅ **Require linear history** (optional - prevents merge commits)
4. Click **Create**

### Verifying Protection Rules

```bash
# Check if branch is protected (requires GitHub CLI)
gh api repos/tpfirman/omnitools-app-mcp/branches/main/protection

# Or visit:
# https://github.com/tpfirman/omnitools-app-mcp/settings/branches
```

---

Thank you for contributing! 🚀
