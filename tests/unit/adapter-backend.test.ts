import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AdapterOmniBackend } from '../../src/backend/adapterBackend';
import { Logger } from '../../src/utils/logger';
import type { Config } from '../../src/config';

const config: Config = {
  toolTimeout: 60,
  maxFileSize: 1024 * 1024,
  searchResultLimit: 10,
  searchRankingMethod: 'keyword',
  omniBackend: 'adapter',
  omniAdapterUrl: 'http://127.0.0.1:8081',
  itToolsUrl: 'http://127.0.0.1:8082',
  allowedDirectories: ['/tmp'],
  logLevel: 'error',
  logFile: 'logs/test.log',
  ffmpegPath: 'ffmpeg',
  omnitoolsUrl: undefined,
};

describe('AdapterOmniBackend', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('delegates omni_search through adapter endpoint', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              {
                name: 'text_uppercase',
                description: 'Convert text to uppercase',
                category: 'text',
                provider: 'omnitools',
                tags: ['text', 'uppercase'],
                score: 10,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        )
      );

    const backend = new AdapterOmniBackend(config, new Logger(config));
    const results = await backend.search({ query: 'uppercase' }, 10);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('text_uppercase');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8081/tools/search',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('normalizes adapter tool failures into ToolResult', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'TOOL_EXECUTION_FAILED',
          message: 'Input invalid',
          details: { field: 'text' },
        }),
        {
          status: 422,
          headers: { 'content-type': 'application/json' },
        }
      )
    );

    const backend = new AdapterOmniBackend(config, new Logger(config));
    const result = await backend.run({
      toolName: 'text_uppercase',
      args: {},
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Adapter request failed');
    expect(result.data).toEqual({ field: 'text' });
  });

  it('normalizes adapter transport failures into ToolResult', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('connect ECONNREFUSED'));

    const backend = new AdapterOmniBackend(config, new Logger(config));
    const result = await backend.run({
      toolName: 'text_uppercase',
      args: { text: 'hello' },
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Adapter transport failure');
  });

  it('normalizes arguments alias to args before adapter run request', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            message: 'ok',
            data: { result: 'HELLO' },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        )
      );

    const backend = new AdapterOmniBackend(config, new Logger(config));
    const result = await backend.run({
      toolName: 'text_uppercase',
      arguments: { text: 'hello' },
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8081/tools/run',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          toolName: 'text_uppercase',
          args: { text: 'hello' },
        }),
      })
    );
  });
});
