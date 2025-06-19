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
      courses: {
        Row: {
          id: string
          title: string
          image: string
          description: string
          fees: number
          course_material_url: string | null
          agent_course_description: string | null
          category: string | null
          sponsored: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          image: string
          description: string
          fees?: number
          course_material_url?: string | null
          agent_course_description?: string | null
          category?: string | null
          sponsored?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          image?: string
          description?: string
          fees?: number
          course_material_url?: string | null
          agent_course_description?: string | null
          category?: string | null
          sponsored?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      chapters: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order_index: number
          created_at: string | null
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order_index?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order_index?: number
          created_at?: string | null
        }
      }
      videos: {
        Row: {
          id: string
          chapter_id: string
          title: string
          url: string
          duration: string | null
          description: string | null
          order_index: number
          created_at: string | null
        }
        Insert: {
          id?: string
          chapter_id: string
          title: string
          url: string
          duration?: string | null
          description?: string | null
          order_index?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          chapter_id?: string
          title?: string
          url?: string
          duration?: string | null
          description?: string | null
          order_index?: number
          created_at?: string | null
        }
      }
      agents: {
        Row: {
          id: string
          chapter_id: string
          title: string
          replica_id: string
          conversational_context: string
          description: string | null
          order_index: number
          created_at: string | null
        }
        Insert: {
          id?: string
          chapter_id: string
          title: string
          replica_id: string
          conversational_context: string
          description?: string | null
          order_index?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          chapter_id?: string
          title?: string
          replica_id?: string
          conversational_context?: string
          description?: string | null
          order_index?: number
          created_at?: string | null
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string | null
          completed_at: string | null
          progress: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrolled_at?: string | null
          completed_at?: string | null
          progress?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrolled_at?: string | null
          completed_at?: string | null
          progress?: Json | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
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