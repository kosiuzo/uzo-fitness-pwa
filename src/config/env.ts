/**
 * Environment Configuration Types and Validation
 * Provides type-safe environment variable access with runtime validation
 */

/**
 * Environment variable schema definition
 */
export interface EnvironmentConfig {
  /** Supabase project URL */
  supabaseUrl: string;
  /** Supabase anonymous public API key */
  supabaseAnonKey: string;
  /** Application environment mode */
  mode: 'development' | 'production' | 'test';
  /** Enable development mode features */
  isDevelopment: boolean;
  /** Enable production mode optimizations */
  isProduction: boolean;
  /** Enable test mode utilities */
  isTest: boolean;
}

/**
 * Environment variable validation errors
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[] = [],
    public readonly invalidVars: string[] = []
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates that a string is a valid URL
 */
function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates that a string is a valid Supabase anonymous key format
 * Supabase anon keys are JWT tokens that start with 'eyJ'
 */
function isValidSupabaseKey(value: string): boolean {
  return value.startsWith('eyJ') && value.length > 100;
}

/**
 * Retrieves and validates environment variable
 */
function getEnvVar(key: string, required = true): string {
  const value = import.meta.env[key];

  if (!value && required) {
    throw new EnvironmentValidationError(
      `Missing required environment variable: ${key}`,
      [key]
    );
  }

  return value || '';
}

/**
 * Validates environment configuration
 * @throws {EnvironmentValidationError} If validation fails
 */
function validateEnvironment(config: Partial<EnvironmentConfig>): void {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  // Check required variables
  if (!config.supabaseUrl) {
    missingVars.push('VITE_SUPABASE_URL');
  } else if (!isValidUrl(config.supabaseUrl)) {
    invalidVars.push('VITE_SUPABASE_URL (invalid URL format)');
  }

  if (!config.supabaseAnonKey) {
    missingVars.push('VITE_SUPABASE_ANON_KEY');
  } else if (!isValidSupabaseKey(config.supabaseAnonKey)) {
    invalidVars.push('VITE_SUPABASE_ANON_KEY (invalid key format)');
  }

  if (missingVars.length > 0 || invalidVars.length > 0) {
    const errorParts: string[] = [];

    if (missingVars.length > 0) {
      errorParts.push(`Missing variables: ${missingVars.join(', ')}`);
    }

    if (invalidVars.length > 0) {
      errorParts.push(`Invalid variables: ${invalidVars.join(', ')}`);
    }

    throw new EnvironmentValidationError(
      `Environment validation failed: ${errorParts.join('; ')}`,
      missingVars,
      invalidVars
    );
  }
}

/**
 * Loads and validates environment configuration
 * @throws {EnvironmentValidationError} If validation fails
 */
function loadEnvironment(): EnvironmentConfig {
  const mode = (import.meta.env.MODE || 'development') as EnvironmentConfig['mode'];

  const config: EnvironmentConfig = {
    supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
    supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    mode,
    isDevelopment: mode === 'development',
    isProduction: mode === 'production',
    isTest: mode === 'test',
  };

  // Validate configuration
  validateEnvironment(config);

  // Additional security checks for production
  if (config.isProduction) {
    if (config.supabaseUrl.includes('localhost') || config.supabaseUrl.includes('127.0.0.1')) {
      throw new EnvironmentValidationError(
        'Production environment cannot use localhost URLs',
        [],
        ['VITE_SUPABASE_URL (localhost not allowed in production)']
      );
    }
  }

  return config;
}

/**
 * Validated environment configuration instance
 * Access this for type-safe environment variables
 *
 * @example
 * ```typescript
 * import { env } from './config/env';
 *
 * const url = env.supabaseUrl;
 * if (env.isDevelopment) {
 *   console.log('Development mode');
 * }
 * ```
 */
export const env: EnvironmentConfig = loadEnvironment();

/**
 * Type-safe environment variable access
 * Use this for additional custom environment variables
 *
 * @example
 * ```typescript
 * const apiKey = getEnvironmentVariable('VITE_API_KEY');
 * const optional = getEnvironmentVariable('VITE_OPTIONAL_KEY', false);
 * ```
 */
export function getEnvironmentVariable(key: string, required = true): string {
  return getEnvVar(key, required);
}
