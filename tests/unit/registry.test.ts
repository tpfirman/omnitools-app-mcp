import { describe, expect, it } from '@jest/globals';
import { ToolRegistry } from '../../src/tools/registry';
import type { Config } from '../../src/config';
import { Logger } from '../../src/utils/logger';

const config: Config = {
  toolTimeout: 60,
  maxFileSize: 1024 * 1024,
  searchResultLimit: 10,
  searchRankingMethod: 'keyword',
  allowedDirectories: ['/tmp'],
  logLevel: 'error',
  logFile: 'logs/test.log',
  ffmpegPath: 'ffmpeg',
  omnitoolsUrl: undefined,
};

describe('ToolRegistry', () => {
  const registry = new ToolRegistry();
  const logger = new Logger(config);

  it('finds text tools via omni_search behavior', () => {
    const results = registry.search({ query: 'uppercase text' }, 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('text_uppercase');
  });

  it('runs a known tool successfully', async () => {
    const result = await registry.run(
      {
        toolName: 'text_lowercase',
        args: { text: 'HELLO WORLD' },
      },
      { config, logger }
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('lowercase');
    expect((result.data as { result: string }).result).toBe('hello world');
  });

  it('returns helpful error for unknown tool', async () => {
    const result = await registry.run(
      {
        toolName: 'does_not_exist',
        args: {},
      },
      { config, logger }
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Unknown tool');
  });

  it('converts CSV to JSON', async () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = await registry.run(
      {
        toolName: 'csv_to_json',
        args: { csv },
      },
      { config, logger }
    );

    expect(result.success).toBe(true);
    const data = result.data as { rowCount: number; rows: Array<Record<string, string>> };
    expect(data.rowCount).toBe(2);
    expect(data.rows[0].name).toBe('Alice');
    expect(data.rows[1].age).toBe('25');
  });
});
