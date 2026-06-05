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
      abandoned_cart_snapshots: {
        Row: {
          id: string
          web_profile_id: string
          customer_id: string
          lines: Json
          last_activity_at: string
          status: string
          first_email_sent_at: string | null
          second_email_sent_at: string | null
          recovery_coupon_id: string | null
          converted_order_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          web_profile_id: string
          customer_id: string
          lines?: Json
          last_activity_at?: string
          status?: string
          first_email_sent_at?: string | null
          second_email_sent_at?: string | null
          recovery_coupon_id?: string | null
          converted_order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          web_profile_id?: string
          customer_id?: string
          lines?: Json
          last_activity_at?: string
          status?: string
          first_email_sent_at?: string | null
          second_email_sent_at?: string | null
          recovery_coupon_id?: string | null
          converted_order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'abandoned_cart_snapshots_web_profile_id_fkey'
            columns: ['web_profile_id']
            isOneToOne: true
            referencedRelation: 'web_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'abandoned_cart_snapshots_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      erp_sync_runs: {
        Row: {
          adapter: string
          error_summary: string | null
          finished_at: string | null
          id: string
          pricing_rows_upserted: number
          products_updated: number
          source: string | null
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
          source?: string | null
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
          source?: string | null
          started_at?: string
          status?: string
          suppliers_updated?: number
        }
        Relationships: []
      }
      storefront_cart_activity: {
        Row: {
          line_count: number
          session_id: string
          total_qty: number
          updated_at: string
        }
        Insert: {
          line_count?: number
          session_id: string
          total_qty?: number
          updated_at?: string
        }
        Update: {
          line_count?: number
          session_id?: string
          total_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'storefront_cart_activity_session_id_fkey'
            columns: ['session_id']
            isOneToOne: true
            referencedRelation: 'storefront_sessions'
            referencedColumns: ['session_id']
          },
        ]
      }
      storefront_sessions: {
        Row: {
          first_seen_at: string
          last_seen_at: string
          session_id: string
          user_agent_hash: string | null
        }
        Insert: {
          first_seen_at?: string
          last_seen_at?: string
          session_id: string
          user_agent_hash?: string | null
        }
        Update: {
          first_seen_at?: string
          last_seen_at?: string
          session_id?: string
          user_agent_hash?: string | null
        }
        Relationships: []
      }
      stock_watches: {
        Row: {
          created_at: string
          id: string
          last_indicator: string | null
          last_notified_at: string | null
          product_title: string | null
          sku: string
          web_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_indicator?: string | null
          last_notified_at?: string | null
          product_title?: string | null
          sku: string
          web_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_indicator?: string | null
          last_notified_at?: string | null
          product_title?: string | null
          sku?: string
          web_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_watches_web_profile_id_fkey'
            columns: ['web_profile_id']
            isOneToOne: false
            referencedRelation: 'web_profiles'
            referencedColumns: ['id']
          },
        ]
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
      erp_invoice_sync_state: {
        Row: {
          customer_id: string
          known_invoice_ids: Json
          last_synced_at: string
        }
        Insert: {
          customer_id: string
          known_invoice_ids?: Json
          last_synced_at?: string
        }
        Update: {
          customer_id?: string
          known_invoice_ids?: Json
          last_synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'erp_invoice_sync_state_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: true
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_disabled_at: string | null
          invoice_channel: Database['public']['Enums']['notification_channel']
          order_channel: Database['public']['Enums']['notification_channel']
          quote_channel: Database['public']['Enums']['notification_channel']
          wishlist_channel: Database['public']['Enums']['notification_channel']
          updated_at: string
          web_profile_id: string
        }
        Insert: {
          email_disabled_at?: string | null
          invoice_channel?: Database['public']['Enums']['notification_channel']
          order_channel?: Database['public']['Enums']['notification_channel']
          quote_channel?: Database['public']['Enums']['notification_channel']
          wishlist_channel?: Database['public']['Enums']['notification_channel']
          updated_at?: string
          web_profile_id: string
        }
        Update: {
          email_disabled_at?: string | null
          invoice_channel?: Database['public']['Enums']['notification_channel']
          order_channel?: Database['public']['Enums']['notification_channel']
          quote_channel?: Database['public']['Enums']['notification_channel']
          wishlist_channel?: Database['public']['Enums']['notification_channel']
          updated_at?: string
          web_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_web_profile_id_fkey'
            columns: ['web_profile_id']
            isOneToOne: true
            referencedRelation: 'web_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          customer_id: string
          email_sent_at: string | null
          id: string
          idempotency_key: string
          payload: Json
          read_at: string | null
          title: string
          type: Database['public']['Enums']['notification_type']
          web_profile_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_id: string
          email_sent_at?: string | null
          id?: string
          idempotency_key: string
          payload?: Json
          read_at?: string | null
          title: string
          type: Database['public']['Enums']['notification_type']
          web_profile_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_id?: string
          email_sent_at?: string | null
          id?: string
          idempotency_key?: string
          payload?: Json
          read_at?: string | null
          title?: string
          type?: Database['public']['Enums']['notification_type']
          web_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_web_profile_id_fkey'
            columns: ['web_profile_id']
            isOneToOne: false
            referencedRelation: 'web_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      customers: {
        Row: {
          billing_address_line1: string | null
          billing_city: string | null
          billing_country: string
          billing_postal_code: string | null
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
          billing_address_line1?: string | null
          billing_city?: string | null
          billing_country?: string
          billing_postal_code?: string | null
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
          billing_address_line1?: string | null
          billing_city?: string | null
          billing_country?: string
          billing_postal_code?: string | null
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
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string | null
          phone: string | null
          postal_code: string
          recipient_name: string | null
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string | null
          postal_code: string
          recipient_name?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string | null
          postal_code?: string
          recipient_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_addresses_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
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
      payment_notifications: {
        Row: {
          created_at: string
          gateway: string
          id: string
          order_reference: string
          raw_parameters: Json
          response_code: string | null
          signature: string
        }
        Insert: {
          created_at?: string
          gateway?: string
          id?: string
          order_reference: string
          raw_parameters?: Json
          response_code?: string | null
          signature: string
        }
        Update: {
          created_at?: string
          gateway?: string
          id?: string
          order_reference?: string
          raw_parameters?: Json
          response_code?: string | null
          signature?: string
        }
        Relationships: []
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
          display_name: string | null
          email: string
          failed_login_count: number
          id: string
          is_active: boolean
          last_login_at: string | null
          locked_until: string | null
          mfa_enabled: boolean
          parent_customer_id: string | null
          permissions: Json
          role: Database["public"]["Enums"]["web_profile_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          display_name?: string | null
          email: string
          failed_login_count?: number
          id: string
          is_active?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          mfa_enabled?: boolean
          parent_customer_id?: string | null
          permissions?: Json
          role?: Database["public"]["Enums"]["web_profile_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          display_name?: string | null
          email?: string
          failed_login_count?: number
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          locked_until?: string | null
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
      create_b2b_subuser: {
        Args: {
          p_customer_id: string
          p_display_name: string
          p_email: string
          p_permissions?: Json
          p_user_id: string
        }
        Returns: string
      }
      current_customer_id: { Args: never; Returns: string }
      is_b2b_superadmin_of_company: {
        Args: { p_company_id: string }
        Returns: boolean
      }
    }
    Enums: {
      notification_channel: "email" | "portal" | "off"
      notification_type:
        | "invoice_new"
        | "order_status"
        | "quote_status"
        | "quote_expiring"
        | "stock_available"
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

