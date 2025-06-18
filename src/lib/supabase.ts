import { createClient } from '@supabase/supabase-js';

// Get environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && 
                    supabaseAnonKey && 
                    supabaseUrl !== 'https://your-supabase-url.supabase.co' && 
                    supabaseUrl !== 'https://your-project-url.supabase.co' &&
                    supabaseAnonKey !== 'your-anon-key' &&
                    !supabaseUrl.includes('placeholder') &&
                    supabaseUrl.includes('.supabase.co');

// Show helpful error messages if not configured
if (!isConfigured) {
  console.error('🔧 Supabase Configuration Required');
  console.error('Please configure your Supabase credentials:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project (or create one)');
  console.error('3. Go to Settings > API');
  console.error('4. Copy your Project URL and anon/public key');
  console.error('5. Update your .env file with the actual values');
  console.error('6. Restart your development server');
  
  if (!supabaseUrl || supabaseUrl.includes('your-project-url') || supabaseUrl.includes('your-supabase-url')) {
    console.error('❌ VITE_SUPABASE_URL is not properly configured');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
    console.error('❌ VITE_SUPABASE_ANON_KEY is not properly configured');
  }
}

// Create client - use actual values if configured, otherwise create a non-functional client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Export validation functions
export const isSupabaseConfigured = () => isConfigured;

export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  key: supabaseAnonKey,
  isConfigured
});

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
  executor_id?: string; // Added executor_id field
  created_at: string;
  updated_at: string;
};