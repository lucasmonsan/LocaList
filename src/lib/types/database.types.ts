export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      map_pin_categories: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      map_pins: {
        Row: {
          id: string
          user_id: string
          category_id: string
          name: string
          description: string | null
          latitude: number
          longitude: number
          address: string | null
          photos: string[]
          is_public: boolean
          osm_id: number | null
          osm_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          name: string
          description?: string | null
          latitude: number
          longitude: number
          address?: string | null
          photos?: string[]
          is_public?: boolean
          osm_id?: number | null
          osm_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          name?: string
          description?: string | null
          latitude?: number
          longitude?: number
          address?: string | null
          photos?: string[]
          is_public?: boolean
          osm_id?: number | null
          osm_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_pins_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "map_pin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      map_reviews: {
        Row: {
          id: string
          pin_id: string
          user_id: string
          rating: number
          comment: string | null
          photos: string[]
          upvotes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pin_id: string
          user_id: string
          rating: number
          comment?: string | null
          photos?: string[]
          upvotes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pin_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          photos?: string[]
          upvotes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_reviews_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "map_pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      map_favorites: {
        Row: {
          id: string
          user_id: string
          pin_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pin_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pin_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_favorites_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "map_pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      map_review_upvotes: {
        Row: {
          id: string
          review_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_review_upvotes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "map_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_review_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_review_upvotes: {
        Args: {
          review_id: string
        }
        Returns: undefined
      }
      decrement_review_upvotes: {
        Args: {
          review_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type PinCategory = Database['public']['Tables']['map_pin_categories']['Row']
export type Pin = Database['public']['Tables']['map_pins']['Row']
export type Review = Database['public']['Tables']['map_reviews']['Row']
export type Favorite = Database['public']['Tables']['map_favorites']['Row']
export type ReviewUpvote = Database['public']['Tables']['map_review_upvotes']['Row']

export type PinInsert = Database['public']['Tables']['map_pins']['Insert']
export type ReviewInsert = Database['public']['Tables']['map_reviews']['Insert']
export type FavoriteInsert = Database['public']['Tables']['map_favorites']['Insert']

export type PinUpdate = Database['public']['Tables']['map_pins']['Update']
export type ReviewUpdate = Database['public']['Tables']['map_reviews']['Update']

// Extended types with relations
export type PinWithCategory = Pin & {
  category: PinCategory
}

export type PinWithDetails = Pin & {
  category: PinCategory
  reviews: Review[]
  favorites_count: number
  average_rating: number
  is_favorited?: boolean
}

// Type para reviews com dados extras do usuário (JOIN ou agregação)
export type ReviewWithUser = Review & {
  user?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
  // Campos calculados/agregados
  user_upvoted?: boolean
  upvotes_count?: number
  user_name?: string
  user_avatar?: string
}

