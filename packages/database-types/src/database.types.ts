export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_name: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          previous_value: Json | null
          source_ip: unknown
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          source_ip?: unknown
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          source_ip?: unknown
        }
        Relationships: []
      }
      erp_sync_runs: {
        Row: {
          adapter: string
          error_summary: string | null
          finished_at: string | null
          id: string
          pricing_rows_upserted: number
          products_updated: number
          started_at: string
          status: string
          suppliers_updated: number
        }
        Insert: {
          adapter: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          pricing_rows_upserted?: number
          products_updated?: number
          started_at?: string
          status: string
          suppliers_updated?: number
        }
        Update: {
          adapter?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          pricing_rows_upserted?: number
          products_updated?: number
          started_at?: string
          status?: string
          suppliers_updated?: number
        }
        Relationships: []
      }
      stock_sync_runs: {
        Row: {
          arnoia_status: string
          distrisantiago_status: string
          error_summary: string | null
          finished_at: string | null
          id: string
          products_updated: number
          started_at: string
          status: string
        }
        Insert: {
          arnoia_status?: string
          distrisantiago_status?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          products_updated?: number
          started_at?: string
          status: string
        }
        Update: {
          arnoia_status?: string
          distrisantiago_status?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          products_updated?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          billing_series: string | null
          commercial_name: string
          created_at: string
          customer_group: number
          default_payment_method: string | null
          email: string
          erp_code: string | null
          general_discount: number
          id: string
          is_company: boolean
          legal_name: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          billing_series?: string | null
          commercial_name: string
          created_at?: string
          customer_group?: number
          default_payment_method?: string | null
          email: string
          erp_code?: string | null
          general_discount?: number
          id?: string
          is_company?: boolean
          legal_name?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          billing_series?: string | null
          commercial_name?: string
          created_at?: string
          customer_group?: number
          default_payment_method?: string | null
          email?: string
          erp_code?: string | null
          general_discount?: number
          id?: string
          is_company?: boolean
          legal_name?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: []
      }
      group_offers: {
        Row: {
          active: boolean
          created_at: string
          customer_group: number | null
          id: string
          offer_net_price: number
          sku_erp: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          customer_group?: number | null
          id?: string
          offer_net_price: number
          sku_erp: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          customer_group?: number | null
          id?: string
          offer_net_price?: number
          sku_erp?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      special_prices: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          net_price: number
          product_sku: string
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          net_price: number
          product_sku: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          net_price?: number
          product_sku?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_prices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      search_events: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          payload: Json
          processed_at: string | null
          status: Database["public"]["Enums"]["search_event_status"]
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["search_event_status"]
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["search_event_status"]
        }
        Relationships: []
      }
      web_profiles: {
        Row: {
          created_at: string
          customer_id: string
          email: string
          id: string
          last_login_at: string | null
          mfa_enabled: boolean
          parent_customer_id: string | null
          permissions: Json
          role: Database["public"]["Enums"]["web_profile_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          email: string
          id: string
          last_login_at?: string | null
          mfa_enabled?: boolean
          parent_customer_id?: string | null
          permissions?: Json
          role?: Database["public"]["Enums"]["web_profile_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string
          id?: string
          last_login_at?: string | null
          mfa_enabled?: boolean
          parent_customer_id?: string | null
          permissions?: Json
          role?: Database["public"]["Enums"]["web_profile_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_profiles_parent_customer_id_fkey"
            columns: ["parent_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_customer_id: { Args: never; Returns: string }
    }
    Enums: {
      search_event_status: "pending" | "processing" | "done" | "error"
      web_profile_role: "b2c" | "b2b_superadmin" | "b2b_subuser" | "pending"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      search_event_status: ["pending", "processing", "done", "error"],
      web_profile_role: ["b2c", "b2b_superadmin", "b2b_subuser", "pending"],
    },
  },
} as const

