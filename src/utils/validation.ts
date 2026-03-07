import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import type { Config } from '../config.js';
import type { Logger } from './logger.js';

const execAsync = promisify(exec);

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Node.js version
 */
function validateNodeVersion(): { passed: boolean; error?: string } {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  
  if (major < 20) {
    return {
      passed: false,
      error: `Node.js 20+ required. Current version: ${version}`,
    };
  }
  
  return { passed: true };
}

/**
 * Validate FFmpeg availability
 */
async function validateFFmpeg(config: Config): Promise<{ passed: boolean; error?: string }> {
  const ffmpegPath = config.ffmpegPath || 'ffmpeg';
  
  try {
    const { stdout } = await execAsync(`${ffmpegPath} -version`);
    if (!stdout.includes('ffmpeg version')) {
      return {
        passed: false,
        error: 'FFmpeg version check failed',
      };
    }
    return { passed: true };
  } catch (error) {
    return {
      passed: false,
      error: `FFmpeg not found at: ${ffmpegPath}. Install FFmpeg or set FFMPEG_PATH in .env`,
    };
  }
}

/**
 * Validate allowed directories exist and are accessible
 */
function validateDirectories(config: Config): { passed: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  for (const dir of config.allowedDirectories) {
    try {
      if (!existsSync(dir)) {
        warnings.push(`Allowed directory does not exist: ${dir}`);
      }
    } catch (error) {
      warnings.push(`Cannot access allowed directory: ${dir}`);
    }
  }
  
  return { passed: true, warnings };
}

/**
 * Run all startup validations
 */
export async function validateStartup(config: Config, logger: Logger): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  logger.info('Running startup validations...');
  
  // Validate Node version
  const nodeCheck = validateNodeVersion();
  if (!nodeCheck.passed && nodeCheck.error) {
    errors.push(nodeCheck.error);
  } else {
    logger.info(`Node.js version: ${process.version} ✓`);
  }
  
  // Validate FFmpeg
  const ffmpegCheck = await validateFFmpeg(config);
  if (!ffmpegCheck.passed && ffmpegCheck.error) {
    errors.push(ffmpegCheck.error);
  } else {
    logger.info('FFmpeg available ✓');
  }
  
  // Validate directories
  const dirCheck = validateDirectories(config);
  warnings.push(...dirCheck.warnings);
  if (dirCheck.warnings.length === 0) {
    logger.info(`Allowed directories validated (${config.allowedDirectories.length}) ✓`);
  } else {
    dirCheck.warnings.forEach(w => logger.warn(w));
  }
  
  const passed = errors.length === 0;
  
  if (!passed) {
    logger.error('Startup validation failed', { errors });
  } else {
    logger.info('All startup validations passed ✓');
  }
  
  return { passed, errors, warnings };
}
