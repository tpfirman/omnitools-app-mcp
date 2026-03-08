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

Releases are created automatically when a PR is merged into `main`. The workflow:

1. Reads the version from `package.json`
2. Checks if a release for that version tag already exists
3. If not, builds the project, runs tests, and creates a GitHub Release with:
   - Tag: `v<version>` (from `package.json`)
   - Release notes: merged PR body
   - Distribution artifacts (`.tar.gz` and `.zip`)

**Before opening a release PR**, bump the version in your branch:

```bash
# Bump the patch, minor, or major version as appropriate
npm version patch --no-git-tag-version

# Commit the version bump
git add package.json package-lock.json
git commit -m "chore: bump version to x.y.z"
```

Then open a PR from `dev` → `main`. Merging that PR triggers the release workflow automatically.

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

See [docs/BRANCH_PROTECTION_SETUP.md](docs/BRANCH_PROTECTION_SETUP.md) for setup instructions.

## Repository Setup

### Initial Clone

```bash
# Clone repository
git clone https://github.com/tpfirman/omnitools-app-mcp.git
cd omnitools-app-mcp

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run tests
npm test

# Build
npm run build
```

### Optional: Run Docker Topology

```bash
docker compose up --build
```

Expected services:
- `omni-tools-ui` on `http://localhost:8080`
- `it-tools-ui` on `http://localhost:8082`
- `omni-adapter` on `http://localhost:8081`
- `mcp-server` (STDIO runtime container)

## CI/CD Pipeline

Our CI/CD runs on:
- Pull requests to `main`
- Pushes to `dev` or `feature/**` branches

### CI Workflow Stages

1. **Checkout** - Fetch repository code
2. **Setup** - Install Node.js 20 and dependencies
3. **Lint** - Run ESLint checks
4. **Test** - Run Jest test suite
5. **Build** - Compile TypeScript

### Release Workflow

Triggered on pushes to `main` (after merges):

1. **Build** - Compile production bundle
2. **Test** - Run full test suite
3. **Package** - Create distribution artifacts
4. **Release** - Create or update GitHub Release with:
  - Version sourced from `package.json`
  - Release notes sourced from merged PR body
  - Footer: `For a full list of changes, see CHANGELOG.md`

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

Branch protection must be configured manually via the GitHub UI. See [docs/BRANCH_PROTECTION_SETUP.md](docs/BRANCH_PROTECTION_SETUP.md) for full instructions.

---

Thank you for contributing! 🚀
