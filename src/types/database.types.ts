// Hand-authored to match supabase/migrations/20260725120000_init.sql in the
// shape produced by `supabase gen types typescript`. Once a local Supabase
// stack is available, regenerate with `npm run gen:types` and diff.
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
      countries: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      flavours: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          country_code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          country_code: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'regions_country_code_fkey'
            columns: ['country_code']
            isOneToOne: false
            referencedRelation: 'countries'
            referencedColumns: ['code']
          },
        ]
      }
      subregions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          region_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          region_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subregions_region_id_fkey'
            columns: ['region_id']
            isOneToOne: false
            referencedRelation: 'regions'
            referencedColumns: ['id']
          },
        ]
      }
      tasting_flavours: {
        Row: {
          flavour_id: string
          tasting_id: string
        }
        Insert: {
          flavour_id: string
          tasting_id: string
        }
        Update: {
          flavour_id?: string
          tasting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasting_flavours_flavour_id_fkey'
            columns: ['flavour_id']
            isOneToOne: false
            referencedRelation: 'flavours'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasting_flavours_tasting_id_fkey'
            columns: ['tasting_id']
            isOneToOne: false
            referencedRelation: 'tastings'
            referencedColumns: ['id']
          },
        ]
      }
      tastings: {
        Row: {
          consumed_on: string
          created_at: string
          currency: string | null
          id: string
          location: string | null
          notes: string | null
          photo_path: string | null
          price: number | null
          rating: number | null
          serving_temp: Database['public']['Enums']['serving_temp'] | null
          updated_at: string
          user_id: string
          vessel: Database['public']['Enums']['vessel_type'] | null
          wine_id: string
        }
        Insert: {
          consumed_on?: string
          created_at?: string
          currency?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          photo_path?: string | null
          price?: number | null
          rating?: number | null
          serving_temp?: Database['public']['Enums']['serving_temp'] | null
          updated_at?: string
          user_id?: string
          vessel?: Database['public']['Enums']['vessel_type'] | null
          wine_id: string
        }
        Update: {
          consumed_on?: string
          created_at?: string
          currency?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          photo_path?: string | null
          price?: number | null
          rating?: number | null
          serving_temp?: Database['public']['Enums']['serving_temp'] | null
          updated_at?: string
          user_id?: string
          vessel?: Database['public']['Enums']['vessel_type'] | null
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tastings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tastings_wine_id_fkey'
            columns: ['wine_id']
            isOneToOne: false
            referencedRelation: 'wines'
            referencedColumns: ['id']
          },
        ]
      }
      varietals: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      wine_varietals: {
        Row: {
          varietal_id: string
          wine_id: string
        }
        Insert: {
          varietal_id: string
          wine_id: string
        }
        Update: {
          varietal_id?: string
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wine_varietals_varietal_id_fkey'
            columns: ['varietal_id']
            isOneToOne: false
            referencedRelation: 'varietals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'wine_varietals_wine_id_fkey'
            columns: ['wine_id']
            isOneToOne: false
            referencedRelation: 'wines'
            referencedColumns: ['id']
          },
        ]
      }
      wines: {
        Row: {
          colour: Database['public']['Enums']['wine_colour'] | null
          country_code: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          producer: string | null
          region_id: string | null
          subregion_id: string | null
          updated_at: string
          vintage: number | null
        }
        Insert: {
          colour?: Database['public']['Enums']['wine_colour'] | null
          country_code?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name: string
          producer?: string | null
          region_id?: string | null
          subregion_id?: string | null
          updated_at?: string
          vintage?: number | null
        }
        Update: {
          colour?: Database['public']['Enums']['wine_colour'] | null
          country_code?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          producer?: string | null
          region_id?: string | null
          subregion_id?: string | null
          updated_at?: string
          vintage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'wines_country_code_fkey'
            columns: ['country_code']
            isOneToOne: false
            referencedRelation: 'countries'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'wines_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'wines_region_id_country_code_fkey'
            columns: ['region_id', 'country_code']
            isOneToOne: false
            referencedRelation: 'regions'
            referencedColumns: ['id', 'country_code']
          },
          {
            foreignKeyName: 'wines_subregion_id_region_id_fkey'
            columns: ['subregion_id', 'region_id']
            isOneToOne: false
            referencedRelation: 'subregions'
            referencedColumns: ['id', 'region_id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_or_create_flavour: {
        Args: {
          p_name: string
        }
        Returns: Database['public']['Tables']['flavours']['Row']
      }
      get_or_create_region: {
        Args: {
          p_country: string
          p_name: string
        }
        Returns: Database['public']['Tables']['regions']['Row']
      }
      get_or_create_subregion: {
        Args: {
          p_region: string
          p_name: string
        }
        Returns: Database['public']['Tables']['subregions']['Row']
      }
      get_or_create_varietal: {
        Args: {
          p_name: string
        }
        Returns: Database['public']['Tables']['varietals']['Row']
      }
    }
    Enums: {
      serving_temp: 'cool' | 'ambient' | 'hot' | 'freezing' | 'on_ice'
      vessel_type: 'glass' | 'bottle' | 'sampler' | 'cup' | 'other'
      wine_colour:
        | 'red'
        | 'white'
        | 'rose'
        | 'orange'
        | 'sparkling'
        | 'fortified'
        | 'dessert'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
