import type { ToolRegistry } from './registry.js';

export function buildCatalogResource(registry: ToolRegistry): string {
  return JSON.stringify(
    {
      summary:
        'OmniTools MCP catalog. Use omni_search to discover a tool, then omni_run with toolName and args.',
      tools: registry.getCatalog(),
    },
    null,
    2
  );
}
