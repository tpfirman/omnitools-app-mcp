#!/usr/bin/env node

import { performance } from 'node:perf_hooks';

const adapterUrl = process.env.OMNI_ADAPTER_URL ?? 'http://127.0.0.1:8081';
const iterations = Number.parseInt(process.env.BENCH_ITERATIONS ?? '25', 10);

async function benchmarkLocal() {
  const { ToolRegistry } = await import('../dist/tools/registry.js');
  const registry = new ToolRegistry();

  const searchDurations = [];
  const runDurations = [];

  for (let i = 0; i < iterations; i += 1) {
    const s0 = performance.now();
    registry.search({ query: 'uppercase text' }, 10);
    searchDurations.push(performance.now() - s0);

    const r0 = performance.now();
    await registry.run(
      { toolName: 'text_uppercase', args: { text: 'hello benchmark' } },
      {
        config: {
          toolTimeout: 60,
          maxFileSize: 52428800,
          searchResultLimit: 10,
          searchRankingMethod: 'keyword',
          omniBackend: 'local',
          omniAdapterUrl: adapterUrl,
          allowedDirectories: ['/tmp'],
          logLevel: 'error',
          logFile: 'logs/bench.log',
          ffmpegPath: 'ffmpeg',
          omnitoolsUrl: undefined,
        },
        logger: {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
        },
      }
    );
    runDurations.push(performance.now() - r0);
  }

  return {
    searchAvgMs: avg(searchDurations),
    runAvgMs: avg(runDurations),
  };
}

async function benchmarkAdapter() {
  const health = await fetch(`${adapterUrl.replace(/\/$/, '')}/health`).then((r) => r.ok).catch(() => false);
  if (!health) {
    return null;
  }

  const searchDurations = [];
  const runDurations = [];

  for (let i = 0; i < iterations; i += 1) {
    const s0 = performance.now();
    await fetch(`${adapterUrl.replace(/\/$/, '')}/tools/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'uppercase text', limit: 10 }),
    });
    searchDurations.push(performance.now() - s0);

    const r0 = performance.now();
    await fetch(`${adapterUrl.replace(/\/$/, '')}/tools/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ toolName: 'text_uppercase', args: { text: 'hello benchmark' } }),
    });
    runDurations.push(performance.now() - r0);
  }

  return {
    searchAvgMs: avg(searchDurations),
    runAvgMs: avg(runDurations),
  };
}

function avg(values) {
  return Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2));
}

const local = await benchmarkLocal();
const adapter = await benchmarkAdapter();

console.log(JSON.stringify({
  iterations,
  local,
  adapter,
}, null, 2));
