import { describe, test, expect, beforeEach } from '@jest/globals';
import { loadConfig } from '../../src/config';

describe('Configuration', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.TOOL_TIMEOUT;
    delete process.env.MAX_FILE_SIZE;
    delete process.env.SEARCH_RESULT_LIMIT;
    delete process.env.OMNI_BACKEND;
    delete process.env.OMNI_ADAPTER_URL;
    delete process.env.ALLOWED_DIRECTORIES;
  });
  
  test('loads default configuration', () => {
    process.env.ALLOWED_DIRECTORIES = '/tmp';
    
    const config = loadConfig();
    
    expect(config.toolTimeout).toBe(60);
    expect(config.maxFileSize).toBe(52428800);
    expect(config.searchResultLimit).toBe(10);
    expect(config.searchRankingMethod).toBe('keyword');
    expect(config.omniBackend).toBe('local');
    expect(config.omniAdapterUrl).toBe('http://127.0.0.1:8081');
    expect(config.logLevel).toBe('info');
  });
  
  test('loads custom configuration from environment', () => {
    process.env.TOOL_TIMEOUT = '120';
    process.env.MAX_FILE_SIZE = '104857600';
    process.env.SEARCH_RESULT_LIMIT = '20';
    process.env.OMNI_BACKEND = 'adapter';
    process.env.OMNI_ADAPTER_URL = 'http://omni-adapter:8081';
    process.env.ALLOWED_DIRECTORIES = '/tmp,/home/user/workspace';
    process.env.LOG_LEVEL = 'debug';
    
    const config = loadConfig();
    
    expect(config.toolTimeout).toBe(120);
    expect(config.maxFileSize).toBe(104857600);
    expect(config.searchResultLimit).toBe(20);
    expect(config.omniBackend).toBe('adapter');
    expect(config.omniAdapterUrl).toBe('http://omni-adapter:8081');
    expect(config.allowedDirectories).toEqual(['/tmp', '/home/user/workspace']);
    expect(config.logLevel).toBe('debug');
  });
  
  test('validates timeout constraints', () => {
    process.env.TOOL_TIMEOUT = '700'; // exceeds max of 600
    process.env.ALLOWED_DIRECTORIES = '/tmp';
    
    expect(() => loadConfig()).toThrow('Invalid configuration');
  });
  
  test('requires at least one allowed directory', () => {
    process.env.ALLOWED_DIRECTORIES = '';
    
    expect(() => loadConfig()).toThrow('Invalid configuration');
  });
});
