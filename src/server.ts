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

/**
 * OmniTools MCP Server
 */
export class OmniToolsServer {
  private server: Server;
  private config: Config;
  private logger: Logger;
  
  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Received ListTools request');
      
      return {
        tools: [
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
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.logger.debug('Received CallTool request', { tool: request.params.name });
      
      const { name, arguments: args } = request.params;
      
      if (name === 'ping') {
        const message = (args as { message?: string }).message || 'No message provided';
        return {
          content: [
            {
              type: 'text',
              text: `Pong! You said: ${message}`,
            },
          ],
        };
      }
      
      throw new Error(`Unknown tool: ${name}`);
    });
    
    // List available resources
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
        ],
      };
    });
    
    // Read resource
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
      
      throw new Error(`Unknown resource: ${uri}`);
    });
  }
  
  async start(): Promise<void> {
    this.logger.info('Starting OmniTools MCP Server...');
    
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
