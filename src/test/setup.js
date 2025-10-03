import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock environment variables for testing
vi.mock('../config/env', () => ({
  env: {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'test-anon-key-1234567890',
    isDevelopment: true,
    mode: 'test',
  },
}));

// Mock Supabase client
vi.mock('../config/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
