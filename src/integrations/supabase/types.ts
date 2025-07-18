export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      adaptive_quiz_sessions: {
        Row: {
          completed_at: string | null
          consecutive_correct: number | null
          consecutive_incorrect: number | null
          current_difficulty: string
          id: string
          is_active: boolean
          questions_correct: number | null
          questions_total: number | null
          quiz_id: string
          session_data: Json | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          consecutive_correct?: number | null
          consecutive_incorrect?: number | null
          current_difficulty?: string
          id?: string
          is_active?: boolean
          questions_correct?: number | null
          questions_total?: number | null
          quiz_id: string
          session_data?: Json | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          consecutive_correct?: number | null
          consecutive_incorrect?: number | null
          current_difficulty?: string
          id?: string
          is_active?: boolean
          questions_correct?: number | null
          questions_total?: number | null
          quiz_id?: string
          session_data?: Json | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          auto_grade: number | null
          feedback: string | null
          file_name: string | null
          file_url: string | null
          grade: number | null
          id: string
          passed_tests: number | null
          status: string
          submitted_at: string
          test_results: Json | null
          text_submission: string | null
          total_tests: number | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          auto_grade?: number | null
          feedback?: string | null
          file_name?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          passed_tests?: number | null
          status?: string
          submitted_at?: string
          test_results?: Json | null
          text_submission?: string | null
          total_tests?: number | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          auto_grade?: number | null
          feedback?: string | null
          file_name?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          passed_tests?: number | null
          status?: string
          submitted_at?: string
          test_results?: Json | null
          text_submission?: string | null
          total_tests?: number | null
          user_id?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          allowed_file_types: string[] | null
          assignment_type: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string
          lesson_id: string
          max_file_size: number | null
          programming_language: string | null
          starter_code: string | null
          template_code: string | null
          title: string
          xp_reward: number
        }
        Insert: {
          allowed_file_types?: string[] | null
          assignment_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions: string
          lesson_id: string
          max_file_size?: number | null
          programming_language?: string | null
          starter_code?: string | null
          template_code?: string | null
          title: string
          xp_reward?: number
        }
        Update: {
          allowed_file_types?: string[] | null
          assignment_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string
          lesson_id?: string
          max_file_size?: number | null
          programming_language?: string | null
          starter_code?: string | null
          template_code?: string | null
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      badges: {
        Row: {
          condition_type: string
          condition_value: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          xp_threshold: number | null
        }
        Insert: {
          condition_type: string
          condition_value: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          xp_threshold?: number | null
        }
        Update: {
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          xp_threshold?: number | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["course_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_profiles: {
        Row: {
          created_at: string
          id: string
          knowledge_retention_rate: number | null
          learning_speed: number | null
          preferred_difficulty: string | null
          response_time_avg: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_retention_rate?: number | null
          learning_speed?: number | null
          preferred_difficulty?: string | null
          response_time_avg?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_retention_rate?: number | null
          learning_speed?: number | null
          preferred_difficulty?: string | null
          response_time_avg?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content_url: string | null
          created_at: string
          description: string | null
          id: string
          module_id: string
          order_index: number
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
          xp_reward: number
        }
        Insert: {
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          module_id: string
          order_index: number
          title: string
          type?: Database["public"]["Enums"]["lesson_type"]
          xp_reward?: number
        }
        Update: {
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          type?: Database["public"]["Enums"]["lesson_type"]
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_analytics: {
        Row: {
          avg_response_time: number | null
          created_at: string
          difficulty_level: string
          id: string
          question_index: number
          quiz_id: string
          success_rate: number | null
          times_correct: number | null
          times_shown: number | null
          updated_at: string
        }
        Insert: {
          avg_response_time?: number | null
          created_at?: string
          difficulty_level?: string
          id?: string
          question_index: number
          quiz_id: string
          success_rate?: number | null
          times_correct?: number | null
          times_shown?: number | null
          updated_at?: string
        }
        Update: {
          avg_response_time?: number | null
          created_at?: string
          difficulty_level?: string
          id?: string
          question_index?: number
          quiz_id?: string
          success_rate?: number | null
          times_correct?: number | null
          times_shown?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answers: number[]
          completed_at: string
          id: string
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers: number[]
          completed_at?: string
          id?: string
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          answers?: number[]
          completed_at?: string
          id?: string
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          questions: Json
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          questions: Json
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          questions?: Json
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_cases: {
        Row: {
          assignment_id: string
          created_at: string
          description: string | null
          expected_output: string
          id: string
          input_data: string
          is_hidden: boolean
          points: number
        }
        Insert: {
          assignment_id: string
          created_at?: string
          description?: string | null
          expected_output: string
          id?: string
          input_data: string
          is_hidden?: boolean
          points?: number
        }
        Update: {
          assignment_id?: string
          created_at?: string
          description?: string | null
          expected_output?: string
          id?: string
          input_data?: string
          is_hidden?: boolean
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          user_id: string
          watch_percentage: number | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
          watch_percentage?: number | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_question_performance: {
        Row: {
          confidence_level: number | null
          created_at: string
          difficulty_at_time: string
          id: string
          is_correct: boolean
          question_index: number
          quiz_id: string
          response_time: number | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          difficulty_at_time: string
          id?: string
          is_correct: boolean
          question_index: number
          quiz_id: string
          response_time?: number | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          difficulty_at_time?: string
          id?: string
          is_correct?: boolean
          question_index?: number
          quiz_id?: string
          response_time?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_award_badges: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      get_adaptive_difficulty: {
        Args: { user_uuid: string; quiz_session_id: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      update_learning_profile: {
        Args: { user_uuid: string; quiz_session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student"
      course_status: "draft" | "published" | "archived"
      lesson_type: "video" | "quiz" | "assignment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student"],
      course_status: ["draft", "published", "archived"],
      lesson_type: ["video", "quiz", "assignment"],
    },
  },
} as const
