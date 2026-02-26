export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          id: string
          name: string
          tiers: Json
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          id?: string
          name: string
          tiers: Json
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          tiers?: Json
        }
        Relationships: []
      }
      activities: {
        Row: {
          created_at: string
          data: Json
          id: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_days: {
        Row: {
          challenge_id: string
          created_at: string
          day_number: number
          id: string
          instructions: string | null
          is_rest_day: boolean | null
          routine_id: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          day_number: number
          id?: string
          instructions?: string | null
          is_rest_day?: boolean | null
          routine_id?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          day_number?: number
          id?: string
          instructions?: string | null
          is_rest_day?: boolean | null
          routine_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_days_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_days_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "workout_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string
          duration_days: number
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          duration_days: number
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_logs: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fats: number
          food_name: string
          id: string
          meal_type: string
          notes: string | null
          protein: number
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          fats: number
          food_name: string
          id?: string
          meal_type: string
          notes?: string | null
          protein: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fats?: number
          food_name?: string
          id?: string
          meal_type?: string
          notes?: string | null
          protein?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          equipment_access: string | null
          fitness_goal: string | null
          fitness_level: string | null
          full_name: string | null
          gender: string | null
          height: number | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: string | null
          theme_preference: Json | null
          updated_at: string
          username: string | null
          weight: number | null
          weight_unit: string | null
          workout_frequency: number | null
          workout_style: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          equipment_access?: string | null
          fitness_goal?: string | null
          fitness_level?: string | null
          full_name?: string | null
          gender?: string | null
          height?: number | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          theme_preference?: Json | null
          updated_at?: string
          username?: string | null
          weight?: number | null
          weight_unit?: string | null
          workout_frequency?: number | null
          workout_style?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          equipment_access?: string | null
          fitness_goal?: string | null
          fitness_level?: string | null
          full_name?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          theme_preference?: Json | null
          updated_at?: string
          username?: string | null
          weight?: number | null
          weight_unit?: string | null
          workout_frequency?: number | null
          workout_style?: string[] | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          category: string
          created_at: string
          id: string
          notes: string | null
          photo_url: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_code: string
          created_at: string
          current_level: number
          current_value: number
          history: Json | null
          id: string
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_code: string
          created_at?: string
          current_level?: number
          current_value?: number
          history?: Json | null
          id?: string
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_code?: string
          created_at?: string
          current_level?: number
          current_value?: number
          history?: Json | null
          id?: string
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_code_fkey"
            columns: ["achievement_code"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_logs: {
        Row: {
          completed_at: string
          created_at: string
          day_number: number
          id: string
          type: string
          user_challenge_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          day_number: number
          id?: string
          type: string
          user_challenge_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          day_number?: number
          id?: string
          type?: string
          user_challenge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_logs_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          created_at: string
          current_day_index: number | null
          id: string
          preferred_workout_days: Json | null
          start_date: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          current_day_index?: number | null
          id?: string
          preferred_workout_days?: Json | null
          start_date?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          current_day_index?: number | null
          id?: string
          preferred_workout_days?: Json | null
          start_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_routines: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          estimated_duration: number | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories_burned: number | null
          created_at: string
          duration: number
          id: string
          name: string
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          duration: number
          id?: string
          name: string
          notes?: string | null
          type: string
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          duration?: number
          id?: string
          name?: string
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type:
      | "workout_completed"
      | "achievement_unlocked"
      | "started_following"
      | "post_liked"
      | "comment_added"
      | "streak_milestone"
      | "weekly_goal_met"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  : never = never,
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
  : never = never,
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
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never