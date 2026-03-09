import { z } from 'zod';
import type { Config } from '../config.js';
import type { Logger } from '../utils/logger.js';

export interface ToolContext {
  config: Config;
  logger: Logger;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  message: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'text' | 'data' | 'file' | 'media' | 'document' | 'system';
  tags: string[];
  schema: z.ZodTypeAny;
  execute: (input: unknown, context: ToolContext) => Promise<ToolResult>;
}

export interface SearchResult {
  name: string;
  description: string;
  category: string;
  provider: string;
  tags: string[];
  score: number;
}

export interface ToolProvider {
  readonly id: string;
  readonly name: string;
  getTools(): ToolDefinition[];
}
