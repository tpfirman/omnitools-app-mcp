import { z } from 'zod';
import { dirname } from 'path';
import { promises as fs } from 'fs';
import type { ToolDefinition } from './types.js';
import { ensureAllowedPath, ensureFileSizeWithinLimit } from './utils.js';

const readTextSchema = z.object({ filePath: z.string() });
const writeTextSchema = z.object({ filePath: z.string(), content: z.string() });

export const fileTools: ToolDefinition[] = [
  {
    name: 'file_read_text',
    description: 'Read UTF-8 text content from an allowed file path',
    category: 'file',
    tags: ['file', 'read', 'text', 'io'],
    schema: readTextSchema,
    execute: async (input, context) => {
      try {
        const { filePath } = readTextSchema.parse(input);
        const safePath = await ensureAllowedPath(filePath, context);
        await ensureFileSizeWithinLimit(safePath, context.config.maxFileSize);
        const content = await fs.readFile(safePath, 'utf-8');
        return {
          success: true,
          data: { filePath: safePath, content },
          message: 'Read file successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'file_write_text',
    description: 'Write UTF-8 text content to an allowed file path',
    category: 'file',
    tags: ['file', 'write', 'text', 'io'],
    schema: writeTextSchema,
    execute: async (input, context) => {
      try {
        const { filePath, content } = writeTextSchema.parse(input);
        const safePath = await ensureAllowedPath(filePath, context);
        const bytes = Buffer.byteLength(content, 'utf-8');
        if (bytes > context.config.maxFileSize) {
          return {
            success: false,
            message: `Content exceeds max allowed size (${bytes} bytes > ${context.config.maxFileSize} bytes)`,
          };
        }

        await fs.mkdir(dirname(safePath), { recursive: true });
        await fs.writeFile(safePath, content, 'utf-8');

        return {
          success: true,
          data: { filePath: safePath, bytesWritten: bytes },
          message: 'Wrote file successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
];
