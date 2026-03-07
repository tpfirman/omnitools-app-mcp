import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { resolve, relative } from 'path';
import { spawn } from 'child_process';
import type { ToolContext } from './types.js';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function isPathAllowed(filePath: string, allowedDirectories: string[]): boolean {
  const resolvedPath = resolve(filePath);

  return allowedDirectories.some((allowedDir) => {
    const resolvedAllowed = resolve(allowedDir);
    const rel = relative(resolvedAllowed, resolvedPath);
    return rel === '' || (!rel.startsWith('..') && !rel.includes('/..') && rel !== '..');
  });
}

export async function ensureAllowedPath(filePath: string, context: ToolContext): Promise<string> {
  const resolvedPath = resolve(filePath);

  if (!isPathAllowed(resolvedPath, context.config.allowedDirectories)) {
    throw new Error(
      `Path is outside allowed directories: ${resolvedPath}. Allowed roots: ${context.config.allowedDirectories.join(', ')}`
    );
  }

  return resolvedPath;
}

export async function ensureFileSizeWithinLimit(filePath: string, maxBytes: number): Promise<void> {
  const stats = await fs.stat(filePath);
  if (stats.size > maxBytes) {
    throw new Error(`File exceeds max size (${stats.size} bytes > ${maxBytes} bytes)`);
  }
}

export async function runCommandWithTimeout(
  command: string,
  args: string[],
  timeoutSeconds: number
): Promise<{ stdout: string; stderr: string }> {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      rejectPromise(new Error(`Command timed out after ${timeoutSeconds}s`));
    }, timeoutSeconds * 1000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      rejectPromise(error);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      rejectPromise(new Error(`Command failed (${command} ${args.join(' ')}): ${stderr || stdout}`));
    });
  });
}

export function parseSimpleCsv(csv: string): Array<Record<string, string>> {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 1) {
    return [];
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = i + 1 < line.length ? line[i + 1] : '';

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const headers = parseLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map(parseLine);

  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header || `column_${index + 1}`] = (row[index] ?? '').trim();
    });
    return obj;
  });
}
