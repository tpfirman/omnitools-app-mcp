import { createHmac, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { ToolDefinition, ToolProvider } from '../types.js';

const base64EncodeSchema = z.object({ text: z.string() });
const base64DecodeSchema = z.object({ encoded: z.string() });
const urlEncodeSchema = z.object({ text: z.string() });
const urlDecodeSchema = z.object({ encoded: z.string() });
const htmlEncodeSchema = z.object({ text: z.string() });
const htmlDecodeSchema = z.object({ encoded: z.string() });
const uuidSchema = z.object({ count: z.number().int().min(1).max(100).default(1) });
const jwtDecodeSchema = z.object({ token: z.string() });
const hmacSchema = z.object({
  data: z.string(),
  key: z.string(),
  algorithm: z.enum(['sha256', 'sha512', 'sha1', 'md5']).default('sha256'),
  encoding: z.enum(['hex', 'base64']).default('hex'),
});
const numberBaseSchema = z.object({
  value: z.string(),
  fromBase: z.number().int().min(2).max(36),
  toBase: z.number().int().min(2).max(36),
});

const itToolsList: ToolDefinition[] = [
  {
    name: 'ittools_base64_encode',
    description: 'Encode a string to Base64',
    category: 'text',
    tags: ['base64', 'encode', 'encoding', 'convert'],
    schema: base64EncodeSchema,
    execute: async (input) => {
      const { text } = base64EncodeSchema.parse(input);
      return { success: true, message: 'Base64 encoded', data: { encoded: Buffer.from(text, 'utf8').toString('base64') } };
    },
  },

  {
    name: 'ittools_base64_decode',
    description: 'Decode a Base64 string back to text',
    category: 'text',
    tags: ['base64', 'decode', 'encoding', 'convert'],
    schema: base64DecodeSchema,
    execute: async (input) => {
      const { encoded } = base64DecodeSchema.parse(input);
      try {
        const decoded = Buffer.from(encoded, 'base64').toString('utf8');
        return { success: true, message: 'Base64 decoded', data: { decoded } };
      } catch {
        return { success: false, message: 'Invalid Base64 input' };
      }
    },
  },

  {
    name: 'ittools_url_encode',
    description: 'URL-encode a string using percent-encoding',
    category: 'text',
    tags: ['url', 'encode', 'percent-encoding', 'uri', 'web'],
    schema: urlEncodeSchema,
    execute: async (input) => {
      const { text } = urlEncodeSchema.parse(input);
      return { success: true, message: 'URL encoded', data: { encoded: encodeURIComponent(text) } };
    },
  },

  {
    name: 'ittools_url_decode',
    description: 'Decode a URL percent-encoded string',
    category: 'text',
    tags: ['url', 'decode', 'percent-encoding', 'uri', 'web'],
    schema: urlDecodeSchema,
    execute: async (input) => {
      const { encoded } = urlDecodeSchema.parse(input);
      try {
        return { success: true, message: 'URL decoded', data: { decoded: decodeURIComponent(encoded) } };
      } catch {
        return { success: false, message: 'Invalid percent-encoded input' };
      }
    },
  },

  {
    name: 'ittools_html_entities_encode',
    description: 'Encode special HTML characters to entities (&amp; &lt; &gt; &quot; &#39;)',
    category: 'text',
    tags: ['html', 'entities', 'encode', 'escape', 'web'],
    schema: htmlEncodeSchema,
    execute: async (input) => {
      const { text } = htmlEncodeSchema.parse(input);
      const encoded = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      return { success: true, message: 'HTML entities encoded', data: { encoded } };
    },
  },

  {
    name: 'ittools_html_entities_decode',
    description: 'Decode HTML entities back to plain text',
    category: 'text',
    tags: ['html', 'entities', 'decode', 'unescape', 'web'],
    schema: htmlDecodeSchema,
    execute: async (input) => {
      const { encoded } = htmlDecodeSchema.parse(input);
      const decoded = encoded
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_: string, code: string) => String.fromCharCode(parseInt(code, 10)));
      return { success: true, message: 'HTML entities decoded', data: { decoded } };
    },
  },

  {
    name: 'ittools_uuid_generate',
    description: 'Generate one or more random UUID v4 values',
    category: 'data',
    tags: ['uuid', 'guid', 'random', 'generate', 'id'],
    schema: uuidSchema,
    execute: async (input) => {
      const { count } = uuidSchema.parse(input);
      const uuids = Array.from({ length: count }, () => randomUUID());
      return {
        success: true,
        message: `Generated ${count} UUID(s)`,
        data: count === 1 ? { uuid: uuids[0] } : { uuids },
      };
    },
  },

  {
    name: 'ittools_jwt_decode',
    description: 'Decode a JWT token and return its header and payload (does not verify signature)',
    category: 'data',
    tags: ['jwt', 'json web token', 'decode', 'auth', 'token'],
    schema: jwtDecodeSchema,
    execute: async (input) => {
      const { token } = jwtDecodeSchema.parse(input);
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { success: false, message: 'Invalid JWT format: expected 3 dot-separated parts' };
      }
      try {
        const decodeBase64Url = (s: string) =>
          JSON.parse(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as unknown;
        const header = decodeBase64Url(parts[0]!);
        const payload = decodeBase64Url(parts[1]!);
        return { success: true, message: 'JWT decoded (signature not verified)', data: { header, payload } };
      } catch {
        return { success: false, message: 'Failed to decode JWT — token may be malformed' };
      }
    },
  },

  {
    name: 'ittools_hmac_generate',
    description: 'Generate an HMAC signature using a secret key',
    category: 'data',
    tags: ['hmac', 'hash', 'crypto', 'signature', 'security', 'sha256'],
    schema: hmacSchema,
    execute: async (input) => {
      const { data, key, algorithm, encoding } = hmacSchema.parse(input);
      const hmac = createHmac(algorithm, key).update(data).digest(encoding);
      return {
        success: true,
        message: `HMAC-${algorithm.toUpperCase()} generated`,
        data: { hmac, algorithm, encoding },
      };
    },
  },

  {
    name: 'ittools_number_base_convert',
    description: 'Convert a number between bases (binary, octal, decimal, hex, or any base 2–36)',
    category: 'data',
    tags: ['number', 'base', 'convert', 'binary', 'hex', 'octal', 'decimal'],
    schema: numberBaseSchema,
    execute: async (input) => {
      const { value, fromBase, toBase } = numberBaseSchema.parse(input);
      const num = parseInt(value, fromBase);
      if (isNaN(num)) {
        return { success: false, message: `'${value}' is not a valid base-${fromBase} number` };
      }
      return {
        success: true,
        message: `Converted base ${fromBase} → base ${toBase}`,
        data: { input: value, fromBase, toBase, result: num.toString(toBase) },
      };
    },
  },
];

export const itToolsProvider: ToolProvider = {
  id: 'ittools',
  name: 'IT-Tools',
  getTools: () => itToolsList,
};
