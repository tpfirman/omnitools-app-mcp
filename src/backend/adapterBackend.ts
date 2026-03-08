import { z } from 'zod';
import type { Config } from '../config.js';
import type { Logger } from '../utils/logger.js';
import type { SearchResult, ToolResult } from '../tools/types.js';
import type { OmniBackend } from './types.js';
import {
  adapterErrorSchema,
  runRequestSchema,
  runResponseSchema,
  searchRequestSchema,
  searchResponseSchema,
  type AdapterErrorPayload,
} from '../adapter/contract.js';

class AdapterRequestError extends Error {
  status?: number;
  payload?: AdapterErrorPayload;

  constructor(message: string, status?: number, payload?: AdapterErrorPayload) {
    super(message);
    this.name = 'AdapterRequestError';
    this.status = status;
    this.payload = payload;
  }
}

export class AdapterOmniBackend implements OmniBackend {
  readonly mode = 'adapter' as const;
  private readonly config: Config;
  private readonly logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async search(input: unknown, defaultLimit: number): Promise<SearchResult[]> {
    const payload = searchRequestSchema.parse({
      ...((input ?? {}) as Record<string, unknown>),
      limit:
        ((input ?? {}) as Record<string, unknown>).limit ??
        defaultLimit,
    });

    const response = await this.postJson('/tools/search', payload, searchResponseSchema);
    return response.results;
  }

  async run(input: unknown): Promise<ToolResult> {
    const payload = runRequestSchema.parse(input ?? {});

    try {
      return await this.postJson('/tools/run', payload, runResponseSchema);
    } catch (error) {
      if (error instanceof AdapterRequestError) {
        this.logger.error('Adapter run request failed', {
          status: error.status,
          code: error.payload?.code,
          message: error.payload?.message ?? error.message,
        });

        return {
          success: false,
          message: `Adapter request failed: ${error.payload?.message ?? error.message}`,
          data: error.payload?.details,
        };
      }

      this.logger.error('Adapter run transport failure', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: `Adapter transport failure: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async healthcheck(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutMs = this.config.toolTimeout * 1000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.url('/health'), {
        method: 'GET',
        signal: controller.signal,
      });
      if (!response.ok) {
        return false;
      }
      const payload = await response.json();
      return typeof payload === 'object' && payload !== null;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async postJson<T>(
    path: string,
    payload: unknown,
    responseSchema: z.ZodType<T>
  ): Promise<T> {
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeoutMs = this.config.toolTimeout * 1000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(this.url(path), {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorPayload = await this.readAdapterError(response);
          throw new AdapterRequestError(
            `Adapter returned HTTP ${response.status}`,
            response.status,
            errorPayload
          );
        }

        const json = await response.json();
        return responseSchema.parse(json);
      } catch (error) {
        if (error instanceof AdapterRequestError) {
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Adapter request timed out after ${this.config.toolTimeout}s`);
        }

        if (attempt < maxAttempts) {
          await sleep(100 * attempt);
          continue;
        }

        throw new Error(
          `Adapter request failed: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error('Adapter request failed after retries');
  }

  private async readAdapterError(response: Response): Promise<AdapterErrorPayload | undefined> {
    try {
      const json = await response.json();
      return adapterErrorSchema.parse(json);
    } catch {
      return undefined;
    }
  }

  private url(path: string): string {
    const base = this.config.omniAdapterUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
