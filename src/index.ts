#!/usr/bin/env node

import { loadConfig } from './config.js';
import { Logger } from './utils/logger.js';
import { validateStartup } from './utils/validation.js';
import { OmniToolsServer } from './server.js';

/**
 * Main entry point for OmniTools MCP Server
 */
async function main() {
  let logger: Logger | undefined;
  
  try {
    // Load and validate configuration
    const config = loadConfig();
    logger = new Logger(config);
    
    logger.info('='.repeat(60));
    logger.info('OmniTools MCP Server v0.1.0');
    logger.info('='.repeat(60));
    
    // Run startup validations
    const validation = await validateStartup(config, logger);
    
    if (!validation.passed) {
      logger.error('Startup validation failed. Server cannot start.');
      validation.errors.forEach(err => logger!.error(`  ❌ ${err}`));
      process.exit(1);
    }
    
    if (validation.warnings.length > 0) {
      logger.warn(`Server starting with ${validation.warnings.length} warning(s)`);
    }
    
    // Start the server
    const server = new OmniToolsServer(config, logger);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger!.info('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger!.info('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
    await server.start();
    
  } catch (error) {
    if (logger) {
      logger.error('Fatal error during startup', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } else {
      console.error('Fatal error:', error);
    }
    process.exit(1);
  }
}

// Run the server
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
