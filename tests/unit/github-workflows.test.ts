import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readWorkflow(fileName: string): string {
  return readFileSync(join(process.cwd(), '.github', 'workflows', fileName), 'utf8');
}

describe('GitHub Actions workflows', () => {
  test('CI workflow keeps required status check name and triggers', () => {
    const ci = readWorkflow('ci.yml');

    expect(ci).toContain('pull_request:');
    expect(ci).toContain('- main');
    expect(ci).toContain('- dev');
    expect(ci).toContain('name: Lint, Test, Build (Node 20)');
  });

  test('branch source check enforces allowed branch flows', () => {
    const branchCheck = readWorkflow('branch-source-check.yml');

    expect(branchCheck).toContain('if [[ "${BASE}" == "main" ]]');
    expect(branchCheck).toContain('"${HEAD}" == "dev" || "${HEAD}" == hotfix/* || "${HEAD}" == bugfix/*');
    expect(branchCheck).toContain('if [[ "${BASE}" == "dev" ]]');
    expect(branchCheck).toContain('"${HEAD}" == feature/* || "${HEAD}" == bugfix/*');
  });

  test('release workflow is merge-to-main and package-version based', () => {
    const release = readWorkflow('release.yml');

    expect(release).toContain('branches:');
    expect(release).toContain('- main');
    expect(release).toContain('VERSION=$(node -e "console.log(require(\'./package.json\').version)")');
    expect(release).toContain('For a full list of changes, see CHANGELOG.md');
    expect(release).toContain('listPullRequestsAssociatedWithCommit');
  });
});
