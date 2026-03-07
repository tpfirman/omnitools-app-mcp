import { z } from 'zod';
import { dataTools } from './data.js';
import { documentTools } from './document.js';
import { fileTools } from './file.js';
import { mediaTools } from './media.js';
import { textTools } from './text.js';
import type { SearchResult, ToolContext, ToolDefinition, ToolResult } from './types.js';

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
  category: z.string().optional(),
});

const runSchema = z.object({
  toolName: z.string().min(1),
  args: z.record(z.any()).default({}),
});

export class ToolRegistry {
  private readonly tools: Map<string, ToolDefinition>;

  constructor() {
    const allTools = [...textTools, ...dataTools, ...documentTools, ...fileTools, ...mediaTools];
    this.tools = new Map(allTools.map((tool) => [tool.name, tool]));
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getCatalog() {
    return this.listTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      tags: tool.tags,
      inputSchema: zodSchemaToJson(tool.schema),
    }));
  }

  search(input: unknown, defaultLimit: number): SearchResult[] {
    const { query, limit, category } = searchSchema.parse(input);
    const normalizedQuery = query.toLowerCase().trim();
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const results = this.listTools()
      .filter((tool) => !category || tool.category === category)
      .map((tool) => {
        const haystack = `${tool.name} ${tool.description} ${tool.tags.join(' ')} ${tool.category}`.toLowerCase();
        let score = 0;

        if (tool.name.toLowerCase().includes(normalizedQuery)) {
          score += 10;
        }

        if (tool.description.toLowerCase().includes(normalizedQuery)) {
          score += 5;
        }

        queryTokens.forEach((token) => {
          if (tool.name.toLowerCase().includes(token)) {
            score += 3;
          }
          if (tool.tags.some((tag) => tag.toLowerCase().includes(token))) {
            score += 2;
          }
          if (haystack.includes(token)) {
            score += 1;
          }
        });

        return {
          name: tool.name,
          description: tool.description,
          category: tool.category,
          tags: tool.tags,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const resultLimit = limit ?? defaultLimit;
    return results.slice(0, resultLimit);
  }

  async run(input: unknown, context: ToolContext): Promise<ToolResult> {
    const { toolName, args } = runSchema.parse(input);
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        message: `Unknown tool: ${toolName}. Use omni_search to find available tools.`,
      };
    }

    try {
      const validatedArgs = tool.schema.parse(args);
      return await tool.execute(validatedArgs, context);
    } catch (error) {
      context.logger.error(`Tool execution failed: ${toolName}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: `Tool '${toolName}' failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

function zodSchemaToJson(schema: z.ZodTypeAny): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    Object.entries(shape).forEach(([key, value]) => {
      if (value instanceof z.ZodString) {
        properties[key] = { type: 'string' };
        required.push(key);
      } else if (value instanceof z.ZodNumber) {
        properties[key] = { type: 'number' };
        required.push(key);
      } else if (value instanceof z.ZodBoolean) {
        properties[key] = { type: 'boolean' };
        required.push(key);
      } else {
        properties[key] = { type: 'string' };
      }
    });

    return {
      type: 'object',
      properties,
      required,
    };
  }

  return { type: 'object' };
}
