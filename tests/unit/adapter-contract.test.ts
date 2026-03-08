import { describe, expect, it } from '@jest/globals';
import {
  adapterErrorSchema,
  runRequestSchema,
  runResponseSchema,
  searchRequestSchema,
  searchResponseSchema,
} from '../../src/adapter/contract';

describe('adapter contract schemas', () => {
  it('validates search request payload', () => {
    const parsed = searchRequestSchema.parse({
      query: 'uppercase text',
      limit: 5,
      category: 'text',
    });

    expect(parsed.query).toBe('uppercase text');
    expect(parsed.limit).toBe(5);
    expect(parsed.category).toBe('text');
  });

  it('rejects malformed run request payload', () => {
    expect(() =>
      runRequestSchema.parse({
        toolName: '',
      })
    ).toThrow();
  });

  it('normalizes run request payload from arguments alias', () => {
    const parsed = runRequestSchema.parse({
      toolName: 'json_format',
      arguments: { input: '{"a":1}' },
    });

    expect(parsed.toolName).toBe('json_format');
    expect(parsed.args).toEqual({ input: '{"a":1}' });
  });

  it('prefers args when both args and arguments are provided', () => {
    const parsed = runRequestSchema.parse({
      toolName: 'json_format',
      args: { input: '{"from":"args"}' },
      arguments: { input: '{"from":"arguments"}' },
    });

    expect(parsed.args).toEqual({ input: '{"from":"args"}' });
  });

  it('validates normalized run response payload', () => {
    const parsed = runResponseSchema.parse({
      success: true,
      message: 'ok',
      data: { result: 'HELLO' },
    });

    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe('ok');
  });

  it('validates normalized adapter error payload', () => {
    const parsed = adapterErrorSchema.parse({
      code: 'TOOL_EXECUTION_FAILED',
      message: 'Tool execution failed',
      details: { toolName: 'text_uppercase' },
    });

    expect(parsed.code).toBe('TOOL_EXECUTION_FAILED');
  });

  it('validates search response payload', () => {
    const parsed = searchResponseSchema.parse({
      results: [
        {
          name: 'text_uppercase',
          description: 'Convert to uppercase',
          category: 'text',
          tags: ['text', 'uppercase'],
          score: 12,
        },
      ],
    });

    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0].name).toBe('text_uppercase');
  });
});
