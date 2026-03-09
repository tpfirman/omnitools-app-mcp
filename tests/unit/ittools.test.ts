import { describe, expect, it } from '@jest/globals';
import { ToolRegistry } from '../../src/tools/registry';
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

describe('IT-Tools provider', () => {
  const registry = new ToolRegistry([itToolsProvider]);
  const ctx = { config, logger: new Logger(config) };

  describe('ittools_base64_encode / ittools_base64_decode', () => {
    it('encodes a string to Base64', async () => {
      const result = await registry.run({ toolName: 'ittools_base64_encode', args: { text: 'Hello, World!' } }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { encoded: string }).encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
    });

    it('decodes a valid Base64 string', async () => {
      const result = await registry.run({ toolName: 'ittools_base64_decode', args: { encoded: 'SGVsbG8sIFdvcmxkIQ==' } }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { decoded: string }).decoded).toBe('Hello, World!');
    });

    it('round-trips encode → decode', async () => {
      const original = 'omnitools MCP server 🔧';
      const enc = await registry.run({ toolName: 'ittools_base64_encode', args: { text: original } }, ctx);
      const dec = await registry.run({ toolName: 'ittools_base64_decode', args: { encoded: (enc.data as { encoded: string }).encoded } }, ctx);
      expect(dec.success).toBe(true);
      expect((dec.data as { decoded: string }).decoded).toBe(original);
    });

    it('rejects malformed Base64 (invalid characters)', async () => {
      const result = await registry.run({ toolName: 'ittools_base64_decode', args: { encoded: 'not valid base64 !!!' } }, ctx);
      expect(result.success).toBe(false);
    });

    it('rejects Base64 with incorrect padding length', async () => {
      const result = await registry.run({ toolName: 'ittools_base64_decode', args: { encoded: 'SGVsbG8' } }, ctx);
      expect(result.success).toBe(false);
    });
  });

  describe('ittools_url_encode / ittools_url_decode', () => {
    it('encodes special URL characters', async () => {
      const result = await registry.run({ toolName: 'ittools_url_encode', args: { text: 'hello world & more=yes' } }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { encoded: string }).encoded).toBe('hello%20world%20%26%20more%3Dyes');
    });

    it('decodes a percent-encoded string', async () => {
      const result = await registry.run({ toolName: 'ittools_url_decode', args: { encoded: 'hello%20world%20%26%20more%3Dyes' } }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { decoded: string }).decoded).toBe('hello world & more=yes');
    });

    it('rejects malformed percent-encoding', async () => {
      const result = await registry.run({ toolName: 'ittools_url_decode', args: { encoded: '%ZZ' } }, ctx);
      expect(result.success).toBe(false);
    });
  });

  describe('ittools_html_entities_encode / ittools_html_entities_decode', () => {
    it('encodes HTML special characters', async () => {
      const result = await registry.run({ toolName: 'ittools_html_entities_encode', args: { text: '<b>Tom & "Jerry"</b>' } }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { encoded: string }).encoded).toBe('&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;');
    });

    it('decodes HTML entities', async () => {
      const result = await registry.run({ toolName: 'ittools_html_entities_decode', args: { encoded: '&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;' } }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { decoded: string }).decoded).toBe('<b>Tom & "Jerry"</b>');
    });

    it('round-trips encode → decode', async () => {
      const original = '<script>alert("xss & \'quotes\'")</script>';
      const enc = await registry.run({ toolName: 'ittools_html_entities_encode', args: { text: original } }, ctx);
      const dec = await registry.run({ toolName: 'ittools_html_entities_decode', args: { encoded: (enc.data as { encoded: string }).encoded } }, ctx);
      expect((dec.data as { decoded: string }).decoded).toBe(original);
    });
  });

  describe('ittools_uuid_generate', () => {
    it('generates a single UUID by default', async () => {
      const result = await registry.run({ toolName: 'ittools_uuid_generate', args: {} }, ctx);
      expect(result.success).toBe(true);
      const uuid = (result.data as { uuid: string }).uuid;
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('generates multiple UUIDs', async () => {
      const result = await registry.run({ toolName: 'ittools_uuid_generate', args: { count: 5 } }, ctx);
      expect(result.success).toBe(true);
      const uuids = (result.data as { uuids: string[] }).uuids;
      expect(uuids).toHaveLength(5);
      const unique = new Set(uuids);
      expect(unique.size).toBe(5);
    });
  });

  describe('ittools_jwt_decode', () => {
    it('decodes a valid JWT token', async () => {
      // HS256 token with payload { "sub": "1234567890", "name": "Test User", "iat": 1516239022 }
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = await registry.run({ toolName: 'ittools_jwt_decode', args: { token } }, ctx);
      expect(result.success).toBe(true);
      const data = result.data as { header: Record<string, unknown>; payload: Record<string, unknown> };
      expect(data.header.alg).toBe('HS256');
      expect(data.payload.sub).toBe('1234567890');
      expect(data.payload.name).toBe('Test User');
    });

    it('rejects a token with wrong number of parts', async () => {
      const result = await registry.run({ toolName: 'ittools_jwt_decode', args: { token: 'not.a.valid.jwt.token' } }, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('3 dot-separated parts');
    });

    it('rejects a token with non-JSON payload', async () => {
      const result = await registry.run({ toolName: 'ittools_jwt_decode', args: { token: 'aGVhZA.bm90anNvbg.c2ln' } }, ctx);
      expect(result.success).toBe(false);
    });
  });

  describe('ittools_hmac_generate', () => {
    it('generates a sha256 HMAC in hex', async () => {
      const result = await registry.run({
        toolName: 'ittools_hmac_generate',
        args: { data: 'hello', key: 'secret', algorithm: 'sha256', encoding: 'hex' },
      }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { hmac: string }).hmac).toBe('88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b');
    });

    it('generates a sha256 HMAC in base64', async () => {
      const result = await registry.run({
        toolName: 'ittools_hmac_generate',
        args: { data: 'hello', key: 'secret', algorithm: 'sha256', encoding: 'base64' },
      }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { hmac: string }).hmac).toBe('iKqz7ejTrflNJquQ07r9SiCDBww7zOnAFO4EpEOEfAs=');
    });
  });

  describe('ittools_number_base_convert', () => {
    it('converts decimal to hexadecimal', async () => {
      const result = await registry.run({ toolName: 'ittools_number_base_convert', args: { value: '255', fromBase: 10, toBase: 16 } }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { result: string }).result).toBe('ff');
    });

    it('converts binary to decimal', async () => {
      const result = await registry.run({ toolName: 'ittools_number_base_convert', args: { value: '11111111', fromBase: 2, toBase: 10 } }, ctx);
      expect(result.success).toBe(true);
      expect((result.data as { result: string }).result).toBe('255');
    });

    it('rejects a value that is invalid for the given base', async () => {
      const result = await registry.run({ toolName: 'ittools_number_base_convert', args: { value: 'xyz', fromBase: 10, toBase: 16 } }, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not a valid base-10 number');
    });
  });

  describe('ToolRegistry duplicate name detection', () => {
    it('throws when two providers register the same tool name', () => {
      const providerA = { id: 'a', name: 'A', getTools: () => [{ name: 'clash', description: '', category: 'text' as const, tags: [], schema: {} as never, execute: async () => ({ success: true, message: '' }) }] };
      const providerB = { id: 'b', name: 'B', getTools: () => [{ name: 'clash', description: '', category: 'text' as const, tags: [], schema: {} as never, execute: async () => ({ success: true, message: '' }) }] };
      expect(() => new ToolRegistry([providerA, providerB])).toThrow("Duplicate tool name 'clash' from provider 'b'");
    });
  });
});
