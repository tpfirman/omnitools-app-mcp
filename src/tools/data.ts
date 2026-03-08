import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { parseCsvLine, parseSimpleCsv } from './utils.js';

const jsonValidateSchema = z.object({ input: z.string() });
const jsonFormatSchema = z.object({ input: z.string(), indent: z.number().int().min(0).max(8).default(2) });
const csvToJsonSchema = z.object({ csv: z.string() });
const csvHeadersSchema = z.object({ csv: z.string() });

export const dataTools: ToolDefinition[] = [
  {
    name: 'json_validate',
    description: 'Validate whether input is valid JSON',
    category: 'data',
    tags: ['json', 'validate', 'data'],
    schema: jsonValidateSchema,
    execute: async (input) => {
      const { input: raw } = jsonValidateSchema.parse(input);
      try {
        const parsed = JSON.parse(raw);
        return {
          success: true,
          data: { valid: true, type: Array.isArray(parsed) ? 'array' : typeof parsed },
          message: 'JSON is valid',
        };
      } catch (error) {
        return {
          success: false,
          data: { valid: false },
          message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'json_format',
    description: 'Pretty-format JSON string',
    category: 'data',
    tags: ['json', 'format', 'pretty'],
    schema: jsonFormatSchema,
    execute: async (input) => {
      const { input: raw, indent } = jsonFormatSchema.parse(input);
      try {
        const parsed = JSON.parse(raw);
        return {
          success: true,
          data: { result: JSON.stringify(parsed, null, indent) },
          message: 'Formatted JSON',
        };
      } catch (error) {
        return {
          success: false,
          message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'csv_to_json',
    description: 'Convert CSV content to JSON rows',
    category: 'data',
    tags: ['csv', 'json', 'convert', 'tabular'],
    schema: csvToJsonSchema,
    execute: async (input) => {
      const { csv } = csvToJsonSchema.parse(input);
      const rows = parseSimpleCsv(csv);
      return {
        success: true,
        data: { rowCount: rows.length, rows },
        message: `Converted CSV to JSON (${rows.length} row(s))`,
      };
    },
  },
  {
    name: 'csv_headers',
    description: 'Extract headers from CSV content',
    category: 'data',
    tags: ['csv', 'headers', 'columns'],
    schema: csvHeadersSchema,
    execute: async (input) => {
      const { csv } = csvHeadersSchema.parse(input);
      const firstLine = csv.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
      const headers = parseCsvLine(firstLine)
        .map((value) => value.trim().replace(/^"|"$/g, ''))
        .filter((value) => value.length > 0);
      return {
        success: true,
        data: { headers, count: headers.length },
        message: `Extracted ${headers.length} CSV header(s)`,
      };
    },
  },
];
