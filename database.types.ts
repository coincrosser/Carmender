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
      bills: {
        Row: {
          id: string
          user_id: string
          date: string
          description: string
          amount: number | null
          type: 'bill' | 'income' | 'reminder'
          status: 'unpaid' | 'paid' | 'payment_arrangement'
          note: string | null
          pa_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          description: string
          amount?: number | null
          type: 'bill' | 'income' | 'reminder'
          status?: 'unpaid' | 'paid' | 'payment_arrangement'
          note?: string | null
          pa_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          description?: string
          amount?: number | null
          type?: 'bill' | 'income' | 'reminder'
          status?: 'unpaid' | 'paid' | 'payment_arrangement'
          note?: string | null
          pa_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_checkins: {
        Row: {
          id: string
          user_id: string
          date: string
          todo_list: Json
          income: number | null
          expenses: Json
          mood: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          todo_list?: Json
          income?: number | null
          expenses?: Json
          mood?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          todo_list?: Json
          income?: number | null
          expenses?: Json
          mood?: string | null
          created_at?: string
        }
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          message: string
          role: 'user' | 'assistant'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          role: 'user' | 'assistant'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          role?: 'user' | 'assistant'
          created_at?: string
        }
      }
      user_goals: {
        Row: {
          id: string
          user_id: string
          goal: string
          target_amount: number | null
          target_date: string | null
          priority: number
          status: 'active' | 'completed' | 'paused'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal: string
          target_amount?: number | null
          target_date?: string | null
          priority?: number
          status?: 'active' | 'completed' | 'paused'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal?: string
          target_amount?: number | null
          target_date?: string | null
          priority?: number
          status?: 'active' | 'completed' | 'paused'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
