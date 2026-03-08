#!/usr/bin/env node

import { execSync } from 'node:child_process';

const adapterUrl = 'http://127.0.0.1:8081';

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

async function waitForHealth(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${adapterUrl}/health`);
      if (res.ok) {
        return;
      }
    } catch {
      // Adapter may not be ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('Timed out waiting for adapter health endpoint');
}

async function post(path, payload) {
  const res = await fetch(`${adapterUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  return { res, body };
}

async function main() {
  try {
    run('docker compose up -d --build omni-adapter');
    await waitForHealth();

    const search = await post('/tools/search', { query: 'uppercase text', limit: 5 });
    if (!search.res.ok || !Array.isArray(search.body.results) || search.body.results.length === 0) {
      throw new Error(`Unexpected search response: ${JSON.stringify(search.body)}`);
    }

    const runResult = await post('/tools/run', {
      toolName: 'text_uppercase',
      args: { text: 'hello docker' },
    });

    if (!runResult.res.ok || runResult.body.success !== true) {
      throw new Error(`Unexpected run response: ${JSON.stringify(runResult.body)}`);
    }

    const resultText = runResult.body?.data?.result;
    if (resultText !== 'HELLO DOCKER') {
      throw new Error(`Unexpected tool output: ${resultText}`);
    }

    console.log('Docker smoke test passed');
  } finally {
    run('docker compose down');
  }
}

main().catch((error) => {
  console.error('Docker smoke test failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
