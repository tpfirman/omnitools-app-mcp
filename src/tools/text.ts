import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { sha256 } from './utils.js';

const uppercaseSchema = z.object({ text: z.string() });
const lowercaseSchema = z.object({ text: z.string() });
const trimSchema = z.object({ text: z.string() });
const wordCountSchema = z.object({ text: z.string() });
const replaceSchema = z.object({ text: z.string(), find: z.string(), replaceWith: z.string() });
const hashSchema = z.object({ text: z.string() });

export const textTools: ToolDefinition[] = [
  {
    name: 'text_uppercase',
    description: 'Convert text to uppercase',
    category: 'text',
    tags: ['text', 'case', 'uppercase', 'format'],
    schema: uppercaseSchema,
    execute: async (input) => {
      const { text } = uppercaseSchema.parse(input);
      return { success: true, data: { result: text.toUpperCase() }, message: 'Converted text to uppercase' };
    },
  },
  {
    name: 'text_lowercase',
    description: 'Convert text to lowercase',
    category: 'text',
    tags: ['text', 'case', 'lowercase', 'format'],
    schema: lowercaseSchema,
    execute: async (input) => {
      const { text } = lowercaseSchema.parse(input);
      return { success: true, data: { result: text.toLowerCase() }, message: 'Converted text to lowercase' };
    },
  },
  {
    name: 'text_trim',
    description: 'Trim leading and trailing whitespace',
    category: 'text',
    tags: ['text', 'trim', 'whitespace'],
    schema: trimSchema,
    execute: async (input) => {
      const { text } = trimSchema.parse(input);
      return { success: true, data: { result: text.trim() }, message: 'Trimmed text' };
    },
  },
  {
    name: 'text_word_count',
    description: 'Count words, characters, and lines in text',
    category: 'text',
    tags: ['text', 'count', 'words', 'characters'],
    schema: wordCountSchema,
    execute: async (input) => {
      const { text } = wordCountSchema.parse(input);
      const words = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;
      const characters = text.length;
      const lines = text.length > 0 ? text.split(/\r?\n/).length : 0;

      return {
        success: true,
        data: { words, characters, lines },
        message: 'Calculated text statistics',
      };
    },
  },
  {
    name: 'text_replace',
    description: 'Replace all occurrences of a substring',
    category: 'text',
    tags: ['text', 'replace', 'find', 'substitute'],
    schema: replaceSchema,
    execute: async (input) => {
      const { text, find, replaceWith } = replaceSchema.parse(input);
      const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const result = text.replace(new RegExp(escapedFind, 'g'), replaceWith);
      return { success: true, data: { result }, message: 'Replaced text occurrences' };
    },
  },
  {
    name: 'text_hash_sha256',
    description: 'Generate SHA-256 hash for text',
    category: 'text',
    tags: ['text', 'hash', 'sha256', 'security'],
    schema: hashSchema,
    execute: async (input) => {
      const { text } = hashSchema.parse(input);
      const hash = sha256(text);
      return { success: true, data: { hash }, message: 'Generated SHA-256 hash' };
    },
  },
];
