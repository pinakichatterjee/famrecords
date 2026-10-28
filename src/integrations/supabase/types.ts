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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_provider_access_blocks: {
        Row: {
          created_at: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          blood_group: string | null
          created_at: string
          height: number | null
          id: string
          member_name: string
          relation: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          blood_group?: string | null
          created_at?: string
          height?: number | null
          id?: string
          member_name: string
          relation?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          blood_group?: string | null
          created_at?: string
          height?: number | null
          id?: string
          member_name?: string
          relation?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_events: {
        Row: {
          created_at: string
          event_date: string
          event_time: string | null
          event_type: string
          family_member_id: string
          id: string
          notes: string | null
          provider: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_time?: string | null
          event_type: string
          family_member_id: string
          id?: string
          notes?: string | null
          provider?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_time?: string | null
          event_type?: string
          family_member_id?: string
          id?: string
          notes?: string | null
          provider?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_events_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          ai_summary: string | null
          ai_summary_at: string | null
          created_at: string
          created_by: string
          document: string
          family_member_id: string
          id: string
          name: string
          provider: string | null
          record_type: string | null
          visit_date: string | null
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_at?: string | null
          created_at?: string
          created_by: string
          document: string
          family_member_id: string
          id?: string
          name: string
          provider?: string | null
          record_type?: string | null
          visit_date?: string | null
        }
        Update: {
          ai_summary?: string | null
          ai_summary_at?: string | null
          created_at?: string
          created_by?: string
          document?: string
          family_member_id?: string
          id?: string
          name?: string
          provider?: string | null
          record_type?: string | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      report_extraction_attempts: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_extraction_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_extractions: {
        Row: {
          attempt_count: number
          corrected: Json | null
          created_at: string
          extraction: Json | null
          failure_code: string | null
          id: string
          medical_record_id: string
          reviewed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          corrected?: Json | null
          created_at?: string
          extraction?: Json | null
          failure_code?: string | null
          id?: string
          medical_record_id: string
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          corrected?: Json | null
          created_at?: string
          extraction?: Json | null
          failure_code?: string | null
          id?: string
          medical_record_id?: string
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_extractions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: true
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          cancel_at_period_end: boolean
          current_period_end: string | null
          plan: string
          provider: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string | null
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_summaries: {
        Row: {
          content: Json
          created_at: string
          family_member_id: string
          id: string
          language: string
          notes: Json
          reviewed_at: string | null
          source_record_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          family_member_id: string
          id?: string
          language: string
          notes?: Json
          reviewed_at?: string | null
          source_record_ids: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          family_member_id?: string
          id?: string
          language?: string
          notes?: Json
          reviewed_at?: string | null
          source_record_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_summaries_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_summaries_user_id_fkey"
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
      ai_usage_this_month: { Args: { _kind: string }; Returns: number }
      current_plan: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
