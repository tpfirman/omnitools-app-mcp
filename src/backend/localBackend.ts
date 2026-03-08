import type { Config } from '../config.js';
import type { Logger } from '../utils/logger.js';
import { ToolRegistry } from '../tools/registry.js';
import type { SearchResult, ToolResult } from '../tools/types.js';
import type { OmniBackend } from './types.js';

export class LocalOmniBackend implements OmniBackend {
  readonly mode = 'local' as const;
  private readonly registry: ToolRegistry;
  private readonly config: Config;
  private readonly logger: Logger;

  constructor(config: Config, logger: Logger, registry?: ToolRegistry) {
    this.registry = registry ?? new ToolRegistry();
    this.config = config;
    this.logger = logger;
  }

  async search(input: unknown, defaultLimit: number): Promise<SearchResult[]> {
    return this.registry.search(input, defaultLimit);
  }

  async run(input: unknown): Promise<ToolResult> {
    return this.registry.run(input, {
      config: this.config,
      logger: this.logger,
    });
  }

  getCatalog() {
    return this.registry.getCatalog();
  }
}
