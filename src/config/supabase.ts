/**
 * Supabase Client Configuration
 * Provides a validated and configured Supabase client instance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase client configuration options
 */
export interface SupabaseConfig {
  auth: {
    /** Enable automatic token refresh */
    autoRefreshToken: boolean;
    /** Persist auth session in local storage */
    persistSession: boolean;
    /** Detect session from URL on mount */
    detectSessionInUrl: boolean;
  };
  global: {
    /** Custom headers for all requests */
    headers: Record<string, string>;
  };
}

/**
 * Default Supabase client configuration
 */
const defaultConfig: SupabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'uzo-fitness-pwa',
    },
  },
};

/**
 * Creates and configures Supabase client with validation
 * @throws {EnvironmentValidationError} If environment variables are invalid
 */
function createSupabaseClient(config: SupabaseConfig = defaultConfig): SupabaseClient {
  // Environment variables are already validated by env module
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, config);

  if (env.isDevelopment) {
    console.log('✅ Supabase client initialized:', {
      url: env.supabaseUrl,
      mode: env.mode,
    });
  }

  return client;
}

/**
 * Singleton Supabase client instance
 * Use this throughout your application for database access
 *
 * @example
 * ```typescript
 * import { supabase } from './config/supabase';
 *
 * // Query data
 * const { data, error } = await supabase
 *   .from('workouts')
 *   .select('*');
 *
 * // Insert data
 * const { data, error } = await supabase
 *   .from('workouts')
 *   .insert({ name: 'Push Day' });
 * ```
 */
export const supabase: SupabaseClient = createSupabaseClient();

/**
 * Create a custom Supabase client with specific configuration
 * Useful for testing or special use cases
 *
 * @example
 * ```typescript
 * const testClient = createCustomSupabaseClient({
 *   auth: {
 *     autoRefreshToken: false,
 *     persistSession: false,
 *     detectSessionInUrl: false,
 *   }
 * });
 * ```
 */
export function createCustomSupabaseClient(
  customConfig: Partial<SupabaseConfig> = {}
): SupabaseClient {
  const mergedConfig: SupabaseConfig = {
    auth: { ...defaultConfig.auth, ...customConfig.auth },
    global: { ...defaultConfig.global, ...customConfig.global },
  };

  return createSupabaseClient(mergedConfig);
}

/**
 * Helper to check Supabase connection health
 * Returns true if connection is successful
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('_health').select('*').limit(1);
    return !error || error.code === 'PGRST116'; // Table not found is OK
  } catch {
    return false;
  }
}

/**
 * Database type definitions will be imported here
 * Generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 */
export type { Database } from '../types/database';
