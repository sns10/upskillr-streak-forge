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
      answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          is_correct: boolean
          order_num: number
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          id?: string
          is_correct?: boolean
          order_num: number
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          order_num?: number
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          batch_name: string
          created_at: string
          id: string
          start_date: string
        }
        Insert: {
          batch_name: string
          created_at?: string
          id?: string
          start_date: string
        }
        Update: {
          batch_name?: string
          created_at?: string
          id?: string
          start_date?: string
        }
        Relationships: []
      }
      coding_assignments: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          problem_statement: string
          test_cases: Json
          test_inputs: Json | null
          test_outputs: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          problem_statement: string
          test_cases?: Json
          test_inputs?: Json | null
          test_outputs?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          problem_statement?: string
          test_cases?: Json
          test_inputs?: Json | null
          test_outputs?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          bits_reward: number
          course_id: string
          created_at: string
          id: string
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          order_num: number
          title: string
          updated_at: string
          video_url: string | null
          xp_reward: number
        }
        Insert: {
          bits_reward?: number
          course_id: string
          created_at?: string
          id?: string
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          order_num: number
          title: string
          updated_at?: string
          video_url?: string | null
          xp_reward?: number
        }
        Update: {
          bits_reward?: number
          course_id?: string
          created_at?: string
          id?: string
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          order_num?: number
          title?: string
          updated_at?: string
          video_url?: string | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          id: string
          order_num: number
          points: number
          question_text: string
          question_type: string
          quiz_id: string
          remedial_lesson_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_num: number
          points?: number
          question_text: string
          question_type?: string
          quiz_id: string
          remedial_lesson_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_num?: number
          points?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
          remedial_lesson_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_remedial_lesson_id_fkey"
            columns: ["remedial_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          completed_at: string
          correct_answers: number
          id: string
          quiz_id: string
          score: number
          status: string | null
          time_taken_minutes: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string
          correct_answers: number
          id?: string
          quiz_id: string
          score: number
          status?: string | null
          time_taken_minutes?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string
          correct_answers?: number
          id?: string
          quiz_id?: string
          score?: number
          status?: string | null
          time_taken_minutes?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lesson_id: string
          max_attempts: number | null
          passing_score: number
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id: string
          max_attempts?: number | null
          passing_score?: number
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string
          max_attempts?: number | null
          passing_score?: number
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
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
      student_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          id: string
          is_correct: boolean
          student_id: string
          submitted_at: string
          submitted_code: string
        }
        Insert: {
          assignment_id: string
          id?: string
          is_correct?: boolean
          student_id: string
          submitted_at?: string
          submitted_code: string
        }
        Update: {
          assignment_id?: string
          id?: string
          is_correct?: boolean
          student_id?: string
          submitted_at?: string
          submitted_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          quiz_attempt_id: string
          selected_answer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          quiz_attempt_id: string
          selected_answer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          quiz_attempt_id?: string
          selected_answer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_selected_answer_id_fkey"
            columns: ["selected_answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          batch_id: string | null
          bits: number
          created_at: string
          email: string
          id: string
          last_activity_date: string | null
          name: string
          streak: number
          updated_at: string
          xp: number
        }
        Insert: {
          batch_id?: string | null
          bits?: number
          created_at?: string
          email: string
          id: string
          last_activity_date?: string | null
          name: string
          streak?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          batch_id?: string | null
          bits?: number
          created_at?: string
          email?: string
          id?: string
          last_activity_date?: string | null
          name?: string
          streak?: number
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [        ]
      },
      collaboration_messages: {
        Row: {
          id: string
          content: string
          sender_id: string
          sender_name: string
          sender_avatar: string | null
          type: string
          channel_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          sender_id: string
          sender_name: string
          sender_avatar?: string | null
          type?: string
          channel_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          sender_id?: string
          sender_name?: string
          sender_avatar?: string | null
          type?: string
          channel_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      study_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          member_count: number
          max_members: number
          is_public: boolean
          created_by: string
          created_at: string
          updated_at: string
          tags: string[]
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          member_count?: number
          max_members?: number
          is_public?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          tags?: string[]
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          member_count?: number
          max_members?: number
          is_public?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      study_group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
          role: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          joined_at?: string
          role?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          joined_at?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          }
          {
            foreignKeyName: "study_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      code_reviews: {
        Row: {
          id: string
          code: string
          language: string
          title: string
          description: string | null
          author_id: string
          author_name: string
          created_at: string
          updated_at: string
          likes: number
          dislikes: number
          comments: number
          status: string
        }
        Insert: {
          id?: string
          code: string
          language: string
          title: string
          description?: string | null
          author_id: string
          author_name: string
          created_at?: string
          updated_at?: string
          likes?: number
          dislikes?: number
          comments?: number
          status?: string
        }
        Update: {
          id?: string
          code?: string
          language?: string
          title?: string
          description?: string | null
          author_id?: string
          author_name?: string
          created_at?: string
          updated_at?: string
          likes?: number
          dislikes?: number
          comments?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      code_review_comments: {
        Row: {
          id: string
          review_id: string
          author_id: string
          author_name: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          review_id: string
          author_id: string
          author_name: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_review_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "code_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_review_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          achievement_title: string
          xp_awarded: number
          bits_awarded: number
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          achievement_title: string
          xp_awarded: number
          bits_awarded: number
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          achievement_title?: string
          xp_awarded?: number
          bits_awarded?: number
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      },
    },
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_student_analytics: {
        Args: { student_uuid: string }
        Returns: {
          total_quizzes: number
          completed_quizzes: number
          average_score: number
          total_assignments: number
          correct_assignments: number
          success_rate: number
          current_streak: number
          longest_streak: number
          days_active: number
        }[]
      }
      get_student_progress: {
        Args: { student_uuid: string }
        Returns: {
          course_id: string
          course_title: string
          total_lessons: number
          completed_lessons: number
          progress_percentage: number
        }[]
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      track_user_activity: {
        Args: {
          user_uuid: string
          activity_type_param: string
          activity_data_param?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      lesson_type: "video" | "coding" | "quiz"
      user_role: "admin" | "student"
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
      lesson_type: ["video", "coding", "quiz"],
      user_role: ["admin", "student"],
    },
  },
} as const
