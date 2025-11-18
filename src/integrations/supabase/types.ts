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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_analysis_history: {
        Row: {
          coinglass_analysis: string | null
          confidence: number
          created_at: string
          decision: string
          entry_trigger_analysis: string | null
          full_reasoning: Json | null
          id: string
          liquidity_analysis: string | null
          price_at_analysis: number
          symbol: string
          timestamp: string
          trend_analysis: string | null
          volume_analysis: string | null
        }
        Insert: {
          coinglass_analysis?: string | null
          confidence: number
          created_at?: string
          decision: string
          entry_trigger_analysis?: string | null
          full_reasoning?: Json | null
          id?: string
          liquidity_analysis?: string | null
          price_at_analysis: number
          symbol: string
          timestamp?: string
          trend_analysis?: string | null
          volume_analysis?: string | null
        }
        Update: {
          coinglass_analysis?: string | null
          confidence?: number
          created_at?: string
          decision?: string
          entry_trigger_analysis?: string | null
          full_reasoning?: Json | null
          id?: string
          liquidity_analysis?: string | null
          price_at_analysis?: number
          symbol?: string
          timestamp?: string
          trend_analysis?: string | null
          volume_analysis?: string | null
        }
        Relationships: []
      }
      ai_trading_signals: {
        Row: {
          coinglass_explanation: string | null
          confidence: number
          created_at: string | null
          decision: string
          entry_price: number | null
          entry_trigger_explanation: string | null
          id: string
          liquidity_explanation: string | null
          reasoning: Json
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          timestamp: string | null
          trend_explanation: string | null
          volume_explanation: string | null
        }
        Insert: {
          coinglass_explanation?: string | null
          confidence: number
          created_at?: string | null
          decision: string
          entry_price?: number | null
          entry_trigger_explanation?: string | null
          id?: string
          liquidity_explanation?: string | null
          reasoning: Json
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          timestamp?: string | null
          trend_explanation?: string | null
          volume_explanation?: string | null
        }
        Update: {
          coinglass_explanation?: string | null
          confidence?: number
          created_at?: string | null
          decision?: string
          entry_price?: number | null
          entry_trigger_explanation?: string | null
          id?: string
          liquidity_explanation?: string | null
          reasoning?: Json
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          timestamp?: string | null
          trend_explanation?: string | null
          volume_explanation?: string | null
        }
        Relationships: []
      }
      analysis_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          query_hash: string
          result: Json
          symbol: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          query_hash: string
          result: Json
          symbol: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          query_hash?: string
          result?: Json
          symbol?: string
        }
        Relationships: []
      }
      coinglass_api_endpoints: {
        Row: {
          base_url: string
          created_at: string | null
          description: string | null
          endpoint_key: string
          endpoint_path: string
          id: string
          is_active: boolean | null
          min_interval: string | null
          optional_params: Json | null
          required_params: Json | null
          updated_at: string | null
        }
        Insert: {
          base_url?: string
          created_at?: string | null
          description?: string | null
          endpoint_key: string
          endpoint_path: string
          id?: string
          is_active?: boolean | null
          min_interval?: string | null
          optional_params?: Json | null
          required_params?: Json | null
          updated_at?: string | null
        }
        Update: {
          base_url?: string
          created_at?: string | null
          description?: string | null
          endpoint_key?: string
          endpoint_path?: string
          id?: string
          is_active?: boolean | null
          min_interval?: string | null
          optional_params?: Json | null
          required_params?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coinglass_metrics_cache: {
        Row: {
          cached_at: string | null
          data: Json
          expires_at: string
          id: string
          metric_type: string
          symbol: string
        }
        Insert: {
          cached_at?: string | null
          data: Json
          expires_at: string
          id?: string
          metric_type: string
          symbol: string
        }
        Update: {
          cached_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
          metric_type?: string
          symbol?: string
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          created_at: string | null
          data: Json
          data_type: string
          expires_at: string | null
          id: string
          interval: string | null
          symbol: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          data_type: string
          expires_at?: string | null
          id?: string
          interval?: string | null
          symbol: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          data_type?: string
          expires_at?: string | null
          id?: string
          interval?: string | null
          symbol?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tatum_price_cache: {
        Row: {
          cached_at: string
          created_at: string
          expires_at: string
          id: string
          price_data: Json
          symbol: string
        }
        Insert: {
          cached_at?: string
          created_at?: string
          expires_at: string
          id?: string
          price_data: Json
          symbol: string
        }
        Update: {
          cached_at?: string
          created_at?: string
          expires_at?: string
          id?: string
          price_data?: Json
          symbol?: string
        }
        Relationships: []
      }
      tatum_price_logs: {
        Row: {
          created_at: string | null
          id: string
          interval: string
          price: number
          symbol: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interval: string
          price: number
          symbol: string
          timestamp?: string
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interval?: string
          price?: number
          symbol?: string
          timestamp?: string
          volume?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
