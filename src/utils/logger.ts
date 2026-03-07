import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import type { Config } from '../config.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private config: Config;
  
  constructor(config: Config) {
    this.config = config;
    this.ensureLogDirectory();
  }
  
  private ensureLogDirectory(): void {
    const logDir = dirname(this.config.logFile);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.logLevel];
  }
  
  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }
  
  private writeToFile(message: string): void {
    try {
      appendFileSync(this.config.logFile, message, 'utf-8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  debug(message: string, meta?: unknown): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, meta);
      console.debug(formatted.trim());
      this.writeToFile(formatted);
    }
  }
  
  info(message: string, meta?: unknown): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, meta);
      console.info(formatted.trim());
      this.writeToFile(formatted);
    }
  }
  
  warn(message: string, meta?: unknown): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, meta);
      console.warn(formatted.trim());
      this.writeToFile(formatted);
    }
  }
  
  error(message: string, meta?: unknown): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, meta);
      console.error(formatted.trim());
      this.writeToFile(formatted);
    }
  }
}
