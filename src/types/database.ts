/**
 * Database Type Definitions
 *
 * This file contains TypeScript types for your Supabase database schema.
 *
 * To regenerate these types from your Supabase project:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: npx supabase login
 * 3. Generate types: npx supabase gen types typescript --local > src/types/database.ts
 *
 * For production: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cycles: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          name: string
          duration_weeks: number
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          workout_id: string
          name: string
          duration_weeks: number
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          name?: string
          duration_weeks?: number
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycles_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      exercises: {
        Row: {
          id: string
          user_id: string | null
          name: string
          category: Database["public"]["Enums"]["exercise_category"]
          instructions: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          category?: Database["public"]["Enums"]["exercise_category"]
          instructions?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          category?: Database["public"]["Enums"]["exercise_category"]
          instructions?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      session_groups: {
        Row: {
          id: string
          user_id: string
          session_id: string
          name: string
          group_type: Database["public"]["Enums"]["group_type"]
          position: number
          rest_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          session_id: string
          name: string
          group_type: Database["public"]["Enums"]["group_type"]
          position: number
          rest_seconds: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          name?: string
          group_type?: Database["public"]["Enums"]["group_type"]
          position?: number
          rest_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_groups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      session_items: {
        Row: {
          id: string
          user_id: string
          session_id: string
          group_id: string
          exercise_id: string
          group_position: number
          position: number
          planned_sets: number | null
          planned_reps: number | null
          planned_weight: number | null
          item_rest_seconds: number | null
          rest_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          session_id: string
          group_id: string
          exercise_id: string
          group_position: number
          position?: number
          planned_sets?: number | null
          planned_reps?: number | null
          planned_weight?: number | null
          item_rest_seconds?: number | null
          rest_seconds: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          group_id?: string
          exercise_id?: string
          group_position?: number
          position?: number
          planned_sets?: number | null
          planned_reps?: number | null
          planned_weight?: number | null
          item_rest_seconds?: number | null
          rest_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "session_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          cycle_id: string | null
          workout_id: string | null
          title: string
          date: string
          duration_seconds: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          cycle_id?: string | null
          workout_id?: string | null
          title: string
          date?: string
          duration_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cycle_id?: string | null
          workout_id?: string | null
          title?: string
          date?: string
          duration_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      sets: {
        Row: {
          id: string
          user_id: string
          session_item_id: string
          set_index: number
          reps: number
          weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          session_item_id: string
          set_index?: number
          reps: number
          weight: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_item_id?: string
          set_index?: number
          reps?: number
          weight?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_session_item_id_fkey"
            columns: ["session_item_id"]
            isOneToOne: false
            referencedRelation: "session_items"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_groups: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          name: string
          group_type: Database["public"]["Enums"]["group_type"]
          position: number
          rest_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          workout_id: string
          name: string
          group_type?: Database["public"]["Enums"]["group_type"]
          position: number
          rest_seconds: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          name?: string
          group_type?: Database["public"]["Enums"]["group_type"]
          position?: number
          rest_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_groups_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_items: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          group_id: string
          exercise_id: string
          group_position: number
          position: number
          set_count: number
          reps: number
          weight: number | null
          item_rest_seconds: number | null
          superset_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          workout_id: string
          group_id: string
          exercise_id: string
          group_position: number
          position?: number
          set_count: number
          reps: number
          weight?: number | null
          item_rest_seconds?: number | null
          superset_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          group_id?: string
          exercise_id?: string
          group_position?: number
          position?: number
          set_count?: number
          reps?: number
          weight?: number | null
          item_rest_seconds?: number | null
          superset_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "workout_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          }
        ]
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_cycle_progress: {
        Row: {
          cycle_id: string
          user_id: string
          name: string
          started_at: string
          target_end: string
          ended_at: string | null
          sessions_done: number
        }
        Relationships: []
      }
      v_exercise_history: {
        Row: {
          user_id: string
          exercise_id: string
          exercise_name: string
          day: string
          total_volume: number
          sets_completed: number
          last_logged_at: string
          session_id: string
          session_title: string
        }
        Relationships: []
      }
    }
    Functions: {
      start_session: {
        Args: {
          p_cycle: string
          p_workout: string
          p_title: string
        }
        Returns: string
      }
      workout_detail_json: {
        Args: {
          p_workout: string
        }
        Returns: Json
      }
      workout_preview_session_json: {
        Args: {
          p_workout: string
        }
        Returns: Json
      }
    }
    Enums: {
      exercise_category: 'strength' | 'cardio' | 'mobility' | 'balance'
      group_type: 'single' | 'superset' | 'triset' | 'circuit'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never
