import type { SearchResult, ToolResult } from '../tools/types.js';

export interface OmniBackend {
  readonly mode: 'local' | 'adapter';
  search(input: unknown, defaultLimit: number): Promise<SearchResult[]>;
  run(input: unknown): Promise<ToolResult>;
}
