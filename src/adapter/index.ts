#!/usr/bin/env node

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { loadConfig } from '../config.js';
import { Logger } from '../utils/logger.js';
import { ToolRegistry } from '../tools/registry.js';
import {
  ADAPTER_VERSION,
  runRequestSchema,
  searchRequestSchema,
} from './contract.js';

async function main() {
  const config = loadConfig();
  const logger = new Logger(config);
  const registry = new ToolRegistry();
  const port = parseInt(process.env.OMNI_ADAPTER_PORT ?? '8081', 10);
  const host = process.env.OMNI_ADAPTER_HOST ?? '0.0.0.0';

  const server = createServer(async (req, res) => {
    try {
      await routeRequest(req, res, registry, config, logger);
    } catch (error) {
      logger.error('Unhandled adapter error', {
        error: error instanceof Error ? error.message : String(error),
      });
      writeError(res, 500, 'INTERNAL_ERROR', 'Unexpected adapter failure');
    }
  });

  server.listen(port, host, () => {
    logger.info('Omni adapter started', {
      host,
      port,
      version: ADAPTER_VERSION,
    });
  });
}

async function routeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  registry: ToolRegistry,
  config: ReturnType<typeof loadConfig>,
  logger: Logger
) {
  if (!req.url || !req.method) {
    writeError(res, 400, 'INVALID_REQUEST', 'Missing method or URL');
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    writeJson(res, 200, {
      status: 'ok',
      service: 'omni-adapter',
      version: ADAPTER_VERSION,
      backend: 'local-registry',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/tools/search') {
    const body = await readJsonBody(req, res);
    if (body === undefined) {
      return;
    }
    const parsed = searchRequestSchema.safeParse(body);

    if (!parsed.success) {
      writeError(res, 400, 'INVALID_SEARCH_REQUEST', 'Invalid search payload', parsed.error.flatten());
      return;
    }

    const results = registry.search(parsed.data, config.searchResultLimit);
    writeJson(res, 200, { results });
    return;
  }

  if (req.method === 'POST' && req.url === '/tools/run') {
    const body = await readJsonBody(req, res);
    if (body === undefined) {
      return;
    }
    const parsed = runRequestSchema.safeParse(body);

    if (!parsed.success) {
      writeError(res, 400, 'INVALID_RUN_REQUEST', 'Invalid run payload', parsed.error.flatten());
      return;
    }

    const result = await registry.run(parsed.data, { config, logger });
    if (!result.success) {
      writeError(res, 422, 'TOOL_EXECUTION_FAILED', result.message, result.data);
      return;
    }

    writeJson(res, 200, result);
    return;
  }

  writeError(res, 404, 'NOT_FOUND', `No route for ${req.method} ${req.url}`);
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function writeError(
  res: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  writeJson(res, statusCode, {
    code,
    message,
    details,
  });
}

async function readJsonBody(req: IncomingMessage, res: ServerResponse): Promise<unknown | undefined> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    writeError(res, 400, 'INVALID_JSON', 'Request body must be valid JSON');
    return undefined;
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Adapter startup error:', error);
  process.exit(1);
});
