import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Configuration schema with validation
 */
const ConfigSchema = z.object({
  toolTimeout: z.number().min(1).max(600).default(60),
  maxFileSize: z.number().min(1).default(52428800), // 50 MB
  searchResultLimit: z.number().min(1).max(100).default(10),
  searchRankingMethod: z.enum(['keyword', 'semantic']).default('keyword'),
  allowedDirectories: z.array(z.string()).min(1),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logFile: z.string().default('logs/mcp-server.log'),
  ffmpegPath: z.string().optional(),
  omnitoolsUrl: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and parse environment variables
 */
function loadEnvVars(): Record<string, string> {
  const env: Record<string, string> = {};
  
  // Load from .env file if it exists
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = parseEnvValue(valueParts.join('='));
        }
      }
    });
  } catch (error) {
    // .env file is optional, will use defaults
  }
  
  // Override with actual environment variables
  // Filter out undefined values from process.env
  const processEnv = Object.entries(process.env).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  
  return { ...env, ...processEnv };
}

function parseEnvValue(rawValue: string): string {
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  // Strip inline comments in .env templates: VALUE  # comment
  return trimmed.replace(/\s+#.*$/, '').trim();
}

/**
 * Parse and validate configuration
 */
export function loadConfig(): Config {
  const env = loadEnvVars();
  
  const rawConfig = {
    toolTimeout: env.TOOL_TIMEOUT ? parseInt(env.TOOL_TIMEOUT, 10) : undefined,
    maxFileSize: env.MAX_FILE_SIZE ? parseInt(env.MAX_FILE_SIZE, 10) : undefined,
    searchResultLimit: env.SEARCH_RESULT_LIMIT ? parseInt(env.SEARCH_RESULT_LIMIT, 10) : undefined,
    searchRankingMethod: env.SEARCH_RANKING_METHOD as 'keyword' | 'semantic' | undefined,
    allowedDirectories: env.ALLOWED_DIRECTORIES !== undefined
      ? env.ALLOWED_DIRECTORIES
          .split(',')
          .map(d => d.trim())
          .filter(Boolean)
      : ['/tmp'],
    logLevel: env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' | undefined,
    logFile: env.LOG_FILE,
    ffmpegPath: env.FFMPEG_PATH,
    omnitoolsUrl: env.OMNITOOLS_URL,
  };
  
  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid configuration. Check .env file and environment variables.');
  }
}
