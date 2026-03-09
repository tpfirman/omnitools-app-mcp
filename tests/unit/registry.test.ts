import { describe, expect, it } from '@jest/globals';
import { ToolRegistry } from '../../src/tools/registry';
import { omniToolsProvider } from '../../src/tools/providers/omnitools';
import { itToolsProvider } from '../../src/tools/providers/ittools';
import type { Config } from '../../src/config';
import { Logger } from '../../src/utils/logger';

const config: Config = {
  toolTimeout: 60,
  maxFileSize: 1024 * 1024,
  searchResultLimit: 10,
  searchRankingMethod: 'keyword',
  omniBackend: 'local',
  omniAdapterUrl: 'http://127.0.0.1:8081',
  itToolsUrl: 'http://127.0.0.1:8082',
  allowedDirectories: ['/tmp'],
  logLevel: 'error',
  logFile: 'logs/test.log',
  ffmpegPath: 'ffmpeg',
  omnitoolsUrl: undefined,
};

describe('ToolRegistry', () => {
  const registry = new ToolRegistry([omniToolsProvider, itToolsProvider]);
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

  it('accepts arguments alias for tool input', async () => {
    const result = await registry.run(
      {
        toolName: 'text_uppercase',
        arguments: { text: 'hello world' },
      },
      { config, logger }
    );

    expect(result.success).toBe(true);
    expect((result.data as { result: string }).result).toBe('HELLO WORLD');
  });

  it('prefers args over arguments when both are present', async () => {
    const result = await registry.run(
      {
        toolName: 'text_lowercase',
        args: { text: 'FROM ARGS' },
        arguments: { text: 'FROM ARGUMENTS' },
      },
      { config, logger }
    );

    expect(result.success).toBe(true);
    expect((result.data as { result: string }).result).toBe('from args');
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

  it('extracts CSV headers with quoted commas', async () => {
    const csv = '"first,name",age\n"Alice",30';
    const result = await registry.run(
      {
        toolName: 'csv_headers',
        args: { csv },
      },
      { config, logger }
    );

    expect(result.success).toBe(true);
    const data = result.data as { headers: string[]; count: number };
    expect(data.headers).toEqual(['first,name', 'age']);
    expect(data.count).toBe(2);
  });

  it('exposes accurate catalog schema for optional, default, and array inputs', () => {
    const catalog = registry.getCatalog();

    const pdfExtractText = catalog.find((tool) => tool.name === 'pdf_extract_text');
    const jsonFormat = catalog.find((tool) => tool.name === 'json_format');
    const pdfMerge = catalog.find((tool) => tool.name === 'pdf_merge');

    expect(pdfExtractText).toBeDefined();
    expect(jsonFormat).toBeDefined();
    expect(pdfMerge).toBeDefined();

    const extractSchema = pdfExtractText?.inputSchema as {
      properties: Record<string, { type: string }>;
      required: string[];
    };
    expect(extractSchema.properties.inputPath.type).toBe('string');
    expect(extractSchema.properties.outputPath.type).toBe('string');
    expect(extractSchema.required).toContain('inputPath');
    expect(extractSchema.required).not.toContain('outputPath');

    const jsonSchema = jsonFormat?.inputSchema as {
      properties: Record<string, { type: string }>;
      required: string[];
    };
    expect(jsonSchema.properties.indent.type).toBe('number');
    expect(jsonSchema.required).not.toContain('indent');

    const mergeSchema = pdfMerge?.inputSchema as {
      properties: Record<string, { type: string; items?: { type: string } }>;
      required: string[];
    };
    expect(mergeSchema.properties.inputPaths.type).toBe('array');
    expect(mergeSchema.properties.inputPaths.items?.type).toBe('string');
    expect(mergeSchema.required).toContain('inputPaths');
  });
});
