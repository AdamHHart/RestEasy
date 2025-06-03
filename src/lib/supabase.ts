import { createClient } from '@supabase/supabase-js';

// These would normally come from environment variables
// For this demo, we're using placeholder values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our Supabase tables
export type User = {
  id: string;
  email: string;
  role: 'planner' | 'executor';
  created_at: string;
  updated_at: string;
};

export type Asset = {
  id: string;
  user_id: string;
  type: 'financial' | 'physical' | 'digital';
  name: string;
  description: string;
  location: string;
  account_number?: string;
  access_info?: string; // This would be encrypted
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  file_path: string;
  category: 'legal' | 'financial' | 'health' | 'personal';
  created_at: string;
  updated_at: string;
};

export type Wish = {
  id: string;
  user_id: string;
  type: 'medical' | 'funeral' | 'personal_message' | 'item_distribution';
  title: string;
  content: string;
  recipient_id?: string;
  created_at: string;
  updated_at: string;
};

export type Executor = {
  id: string;
  planner_id: string;
  name: string;
  email: string;
  relationship: string;
  status: 'pending' | 'active' | 'revoked';
  created_at: string;
  updated_at: string;
};

export type TriggerEvent = {
  id: string;
  user_id: string;
  type: 'incapacitation' | 'death';
  verification_method: 'professional' | 'manual';
  verification_details: string;
  triggered: boolean;
  triggered_date?: string;
  created_at: string;
  updated_at: string;
};