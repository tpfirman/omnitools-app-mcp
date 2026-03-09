export function buildCatalogResource(
  tools: Array<Record<string, unknown>>,
  backendMode: 'local' | 'adapter'
): string {
  const providerIds = [...new Set(tools.map((t) => t['provider'] as string).filter(Boolean))];

  return JSON.stringify(
    {
      summary:
        'OmniTools MCP catalog. Use omni_search to discover a tool, then omni_run with toolName and args (or arguments alias). Tools are grouped by provider (e.g. omnitools, ittools).',
      backendMode,
      providers: providerIds,
      tools,
    },
    null,
    2
  );
}
