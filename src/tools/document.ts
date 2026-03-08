import { dirname } from 'path';
import { promises as fs } from 'fs';
import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { ensureAllowedPath, ensureFileSizeWithinLimit, runCommandWithTimeout } from './utils.js';

const pdfExtractTextSchema = z.object({
  inputPath: z.string(),
  outputPath: z.string().optional(),
});

const pdfMergeSchema = z.object({
  inputPaths: z.array(z.string()).min(2),
  outputPath: z.string(),
});

export const documentTools: ToolDefinition[] = [
  {
    name: 'pdf_extract_text',
    description: 'Extract text from a PDF file using pdftotext',
    category: 'document',
    tags: ['pdf', 'text', 'extract', 'document'],
    schema: pdfExtractTextSchema,
    execute: async (input, context) => {
      try {
        const { inputPath, outputPath } = pdfExtractTextSchema.parse(input);
        const safeInput = await ensureAllowedPath(inputPath, context);
        await ensureFileSizeWithinLimit(safeInput, context.config.maxFileSize);

        if (outputPath) {
          const safeOutput = await ensureAllowedPath(outputPath, context);
          await fs.mkdir(dirname(safeOutput), { recursive: true });
          await runCommandWithTimeout('pdftotext', [safeInput, safeOutput], context.config.toolTimeout);
          return {
            success: true,
            data: { outputPath: safeOutput },
            message: 'Extracted PDF text to output file',
          };
        }

        const { stdout } = await runCommandWithTimeout('pdftotext', [safeInput, '-'], context.config.toolTimeout);
        return {
          success: true,
          data: { text: stdout },
          message: 'Extracted PDF text',
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to extract PDF text: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'pdf_merge',
    description: 'Merge multiple PDF files into one output using pdfunite',
    category: 'document',
    tags: ['pdf', 'merge', 'document'],
    schema: pdfMergeSchema,
    execute: async (input, context) => {
      try {
        const { inputPaths, outputPath } = pdfMergeSchema.parse(input);
        const safeInputs = await Promise.all(inputPaths.map((path) => ensureAllowedPath(path, context)));
        await Promise.all(safeInputs.map((path) => ensureFileSizeWithinLimit(path, context.config.maxFileSize)));

        const safeOutput = await ensureAllowedPath(outputPath, context);
        await fs.mkdir(dirname(safeOutput), { recursive: true });

        await runCommandWithTimeout('pdfunite', [...safeInputs, safeOutput], context.config.toolTimeout);

        return {
          success: true,
          data: { outputPath: safeOutput, inputs: safeInputs.length },
          message: `Merged ${safeInputs.length} PDF files`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to merge PDFs: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
];
