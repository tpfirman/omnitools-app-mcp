import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Config } from './config.js';
import type { Logger } from './utils/logger.js';
import { buildCatalogResource } from './tools/catalog.js';
import { LocalOmniBackend } from './backend/localBackend.js';
import { AdapterOmniBackend } from './backend/adapterBackend.js';
import type { OmniBackend } from './backend/types.js';

/**
 * OmniTools MCP Server
 */
export class OmniToolsServer {
  private server: Server;
  private config: Config;
  private logger: Logger;
  private backend: OmniBackend;
  private localCatalogBackend: LocalOmniBackend;

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.localCatalogBackend = new LocalOmniBackend(config, logger);
    this.backend =
      config.omniBackend === 'adapter'
        ? new AdapterOmniBackend(config, logger)
        : this.localCatalogBackend;

    this.server = new Server(
      {
        name: 'omnitools-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Received ListTools request');

      return {
        tools: [
          {
            name: 'omni_search',
            description: 'Search available OmniTools capabilities by natural language query',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'What capability you need' },
                limit: { type: 'number', description: 'Optional result count override' },
                category: { type: 'string', description: 'Optional category filter' },
              },
              required: ['query'],
            },
          },
          {
            name: 'omni_run',
            description: 'Run a specific OmniTools capability by tool name and arguments',
            inputSchema: {
              type: 'object',
              properties: {
                toolName: { type: 'string', description: 'Tool to execute' },
                args: { type: 'object', description: 'Tool arguments' },
              },
              required: ['toolName'],
            },
          },
          {
            name: 'ping',
            description: 'Simple connectivity test tool',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Message to echo back',
                },
              },
              required: ['message'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.logger.debug('Received CallTool request', { tool: request.params.name });

      const { name, arguments: args } = request.params;

      if (name === 'ping') {
        const message = (args as { message: string }).message;
        return {
          content: [{ type: 'text', text: `Pong! You said: ${message}` }],
        };
      }

      if (name === 'omni_search') {
        const start = Date.now();
        try {
          const results = await this.backend.search(args ?? {}, this.config.searchResultLimit);
          this.logger.info('omni_search completed', {
            backend: this.config.omniBackend,
            durationMs: Date.now() - start,
            count: results.length,
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    query: (args as { query?: string } | undefined)?.query ?? '',
                    count: results.length,
                    results,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        } finally {
          this.logger.debug('omni_search request finished', {
            backend: this.config.omniBackend,
            durationMs: Date.now() - start,
          });
        }
      }

      if (name === 'omni_run') {
        const start = Date.now();
        const result = await this.backend.run(args ?? {});
        this.logger.info('omni_run completed', {
          backend: this.config.omniBackend,
          durationMs: Date.now() - start,
          success: result.success,
          message: result.message,
        });

        return {
          isError: !result.success,
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Received ListResources request');

      return {
        resources: [
          {
            uri: 'omnitools://config',
            name: 'Server Configuration',
            description: 'Current server configuration and settings',
            mimeType: 'application/json',
          },
          {
            uri: 'omnitools://catalog',
            name: 'Tools Catalog',
            description: 'Available tools and schemas for omni_search/omni_run',
            mimeType: 'application/json',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      this.logger.debug('Received ReadResource request', { uri: request.params.uri });

      const { uri } = request.params;

      if (uri === 'omnitools://config') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  toolTimeout: this.config.toolTimeout,
                  maxFileSize: this.config.maxFileSize,
                  searchResultLimit: this.config.searchResultLimit,
                  searchRankingMethod: this.config.searchRankingMethod,
                  omniBackend: this.config.omniBackend,
                  omniAdapterUrl: this.config.omniAdapterUrl,
                  allowedDirectories: this.config.allowedDirectories,
                  logLevel: this.config.logLevel,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (uri === 'omnitools://catalog') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: buildCatalogResource(this.localCatalogBackend.getCatalog(), this.config.omniBackend),
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Unknown resource: ${uri}`,
          },
        ],
      };
    });
  }
  
  async start(): Promise<void> {
    this.logger.info('Starting OmniTools MCP Server...', {
      backend: this.config.omniBackend,
      adapterUrl: this.config.omniAdapterUrl,
    });
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.logger.info('Server started and listening on STDIO');
  }
  
  async stop(): Promise<void> {
    this.logger.info('Stopping server...');
    await this.server.close();
    this.logger.info('Server stopped');
  }
}
