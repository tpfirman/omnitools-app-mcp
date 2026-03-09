import { z } from 'zod';
import type { SearchResult, ToolResult } from '../tools/types.js';

export const ADAPTER_VERSION = 'v1';

export const searchRequestSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
  category: z.string().optional(),
});

export const searchResultSchema: z.ZodType<SearchResult> = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  provider: z.string(),
  tags: z.array(z.string()),
  score: z.number(),
});

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
});

export const runRequestSchema = z.object({
  toolName: z.string().min(1),
  args: z.record(z.unknown()).optional(),
  arguments: z.record(z.unknown()).optional(),
}).transform((payload) => ({
  toolName: payload.toolName,
  args: payload.args ?? payload.arguments ?? {},
}));

export const runResponseSchema: z.ZodType<ToolResult> = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
});

export const adapterErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type AdapterErrorPayload = z.infer<typeof adapterErrorSchema>;
