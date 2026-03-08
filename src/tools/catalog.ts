export function buildCatalogResource(
  tools: Array<Record<string, unknown>>,
  backendMode: 'local' | 'adapter'
): string {
  return JSON.stringify(
    {
      summary:
        'OmniTools MCP catalog. Use omni_search to discover a tool, then omni_run with toolName and args.',
      backendMode,
      tools,
    },
    null,
    2
  );
}
