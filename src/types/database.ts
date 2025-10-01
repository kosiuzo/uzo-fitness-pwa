/**
 * Database Type Definitions
 *
 * This file contains TypeScript types for your Supabase database schema.
 *
 * To regenerate these types from your Supabase project:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: npx supabase login
 * 3. Generate types: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 *
 * Replace YOUR_PROJECT_ID with your actual Supabase project ID from the dashboard.
 */

export interface Database {
  public: {
    Tables: {
      // Add your table definitions here
      // Example structure:
      // workouts: {
      //   Row: {
      //     id: string;
      //     name: string;
      //     created_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     name: string;
      //     created_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     name?: string;
      //     created_at?: string;
      //   };
      // };
    };
    Views: {
      // Add your view definitions here
    };
    Functions: {
      // Add your function definitions here
    };
    Enums: {
      // Add your enum definitions here
    };
  };
}
