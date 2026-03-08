import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Docker Compose topology', () => {
  test('includes IT-Tools container and MCP wiring', () => {
    const compose = readFileSync(join(process.cwd(), 'docker-compose.yml'), 'utf8');

    expect(compose).toContain('it-tools-ui:');
    expect(compose).toContain('image: ghcr.io/corentinth/it-tools:latest');
    expect(compose).toContain('"8082:80"');
    expect(compose).toContain('IT_TOOLS_URL: http://it-tools-ui:80');
  });
});
