#!/usr/bin/env node

import { execSync } from 'node:child_process';

const adapterUrl = 'http://127.0.0.1:8081';
const itToolsUrl = 'http://127.0.0.1:8082';

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

async function waitForHealth(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // Service may not be ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for service health endpoint: ${url}`);
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
    run('docker compose up -d --build omni-adapter it-tools-ui');
    await waitForHealth(`${adapterUrl}/health`);
    await waitForHealth(itToolsUrl);

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

    const itToolsResponse = await fetch(itToolsUrl);
    if (!itToolsResponse.ok) {
      throw new Error(`IT-Tools container unavailable: HTTP ${itToolsResponse.status}`);
    }

    console.log('Docker smoke test passed (adapter + IT-Tools)');
  } finally {
    run('docker compose down');
  }
}

main().catch((error) => {
  console.error('Docker smoke test failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
