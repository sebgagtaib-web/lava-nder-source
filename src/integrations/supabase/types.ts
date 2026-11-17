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
      categories: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string | null
          name_fr: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en?: string | null
          name_fr?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string | null
          name_fr?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      delivery_rates: {
        Row: {
          home_enabled: boolean
          home_price: number
          name_ar: string
          name_fr: string
          office_enabled: boolean
          office_price: number
          wilaya_code: number
        }
        Insert: {
          home_enabled?: boolean
          home_price?: number
          name_ar: string
          name_fr: string
          office_enabled?: boolean
          office_price?: number
          wilaya_code: number
        }
        Update: {
          home_enabled?: boolean
          home_price?: number
          name_ar?: string
          name_fr?: string
          office_enabled?: boolean
          office_price?: number
          wilaya_code?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string | null
          id: string
          image: string | null
          in_bundle: boolean
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          unit_cost: number
          unit_price: number
        }
        Insert: {
          color?: string | null
          id?: string
          image?: string | null
          in_bundle?: boolean
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          size?: string | null
          unit_cost?: number
          unit_price: number
        }
        Update: {
          color?: string | null
          id?: string
          image?: string | null
          in_bundle?: boolean
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          admin_notes: string | null
          channel: Database["public"]["Enums"]["sales_channel"]
          commune: string
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_fee: number
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          discount: number
          id: string
          merchant_id: string | null
          notes: string | null
          order_number: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          total_cost: number
          updated_at: string
          wilaya_code: number
          wilaya_name: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          channel: Database["public"]["Enums"]["sales_channel"]
          commune: string
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          discount?: number
          id?: string
          merchant_id?: string | null
          notes?: string | null
          order_number?: never
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_cost?: number
          updated_at?: string
          wilaya_code: number
          wilaya_name: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          channel?: Database["public"]["Enums"]["sales_channel"]
          commune?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          discount?: number
          id?: string
          merchant_id?: string | null
          notes?: string | null
          order_number?: never
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_cost?: number
          updated_at?: string
          wilaya_code?: number
          wilaya_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          cost_price: number
          product_id: string
        }
        Insert: {
          cost_price?: number
          product_id: string
        }
        Update: {
          cost_price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          channel: Database["public"]["Enums"]["sales_channel"]
          colors: string[]
          compare_at_price: number | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          images: string[]
          is_active: boolean
          is_bundle_eligible: boolean
          is_featured: boolean
          material: string | null
          min_quantity: number
          name_ar: string
          name_en: string | null
          name_fr: string | null
          price: number
          sizes: string[]
          stock: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          channel?: Database["public"]["Enums"]["sales_channel"]
          colors?: string[]
          compare_at_price?: number | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_bundle_eligible?: boolean
          is_featured?: boolean
          material?: string | null
          min_quantity?: number
          name_ar: string
          name_en?: string | null
          name_fr?: string | null
          price: number
          sizes?: string[]
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          channel?: Database["public"]["Enums"]["sales_channel"]
          colors?: string[]
          compare_at_price?: number | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_bundle_eligible?: boolean
          is_featured?: boolean
          material?: string | null
          min_quantity?: number
          name_ar?: string
          name_en?: string | null
          name_fr?: string | null
          price?: number
          sizes?: string[]
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string
          wilaya_code: number | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          phone: string
          wilaya_code?: number | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string
          wilaya_code?: number | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          bundle_discount_percent: number
          bundle_min_items: number
          default_wholesale_min_qty: number
          facebook: string | null
          id: number
          instagram: string | null
          phone: string | null
          store_name: string
          tagline: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          bundle_discount_percent?: number
          bundle_min_items?: number
          default_wholesale_min_qty?: number
          facebook?: string | null
          id?: number
          instagram?: string | null
          phone?: string | null
          store_name?: string
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          bundle_discount_percent?: number
          bundle_min_items?: number
          default_wholesale_min_qty?: number
          facebook?: string | null
          id?: number
          instagram?: string | null
          phone?: string | null
          store_name?: string
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "merchant"
      delivery_type: "office" | "home"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
      sales_channel: "retail" | "wholesale"
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
      app_role: ["admin", "merchant"],
      delivery_type: ["office", "home"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      sales_channel: ["retail", "wholesale"],
    },
  },
} as const
