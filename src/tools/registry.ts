import { z } from 'zod';
import type { SearchResult, ToolContext, ToolDefinition, ToolProvider, ToolResult } from './types.js';

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
  category: z.string().optional(),
});

const runSchema = z.object({
  toolName: z.string().min(1),
  args: z.record(z.any()).optional(),
  arguments: z.record(z.any()).optional(),
}).transform((payload) => ({
  toolName: payload.toolName,
  args: payload.args ?? payload.arguments ?? {},
}));

export class ToolRegistry {
  private readonly tools: Map<string, ToolDefinition>;
  private readonly toolProvider: Map<string, string>;

  constructor(providers: ToolProvider[]) {
    this.tools = new Map();
    this.toolProvider = new Map();
    for (const provider of providers) {
      for (const tool of provider.getTools()) {
        this.tools.set(tool.name, tool);
        this.toolProvider.set(tool.name, provider.id);
      }
    }
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getCatalog() {
    return this.listTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      provider: this.toolProvider.get(tool.name) ?? 'unknown',
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
          provider: this.toolProvider.get(tool.name) ?? 'unknown',
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
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    Object.entries(shape).forEach(([key, value]) => {
      const isOptional = value instanceof z.ZodOptional || value instanceof z.ZodDefault;
      properties[key] = zodTypeToJson(value);

      if (!isOptional) {
        required.push(key);
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

function zodTypeToJson(type: z.ZodTypeAny): Record<string, unknown> {
  if (type instanceof z.ZodOptional || type instanceof z.ZodDefault) {
    return zodTypeToJson(type._def.innerType);
  }

  if (type instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodTypeToJson(type._def.type),
    };
  }

  if (type instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: type.options,
    };
  }

  if (type instanceof z.ZodString) {
    return { type: 'string' };
  }

  if (type instanceof z.ZodNumber) {
    return { type: 'number' };
  }

  if (type instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }

  if (type instanceof z.ZodRecord) {
    return {
      type: 'object',
      additionalProperties: true,
    };
  }

  if (type instanceof z.ZodObject) {
    return zodSchemaToJson(type);
  }

  return { type: 'string' };
}
