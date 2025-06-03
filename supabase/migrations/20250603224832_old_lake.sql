/*
  # Initial database schema for Rest Easy

  1. New Tables
    - `profiles`: Links to auth.users and stores user role information
    - `assets`: Stores user assets (financial, physical, digital)
    - `documents`: Stores uploaded documents metadata
    - `wishes`: Stores user wishes and preferences
    - `executors`: Stores designated executors
    - `trigger_events`: Defines conditions for executor access

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for executors to view data when triggered
*/

-- Create profiles table to store user roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('planner', 'executor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('financial', 'physical', 'digital')),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  account_number TEXT,
  access_info TEXT, -- This would be encrypted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own assets"
  ON assets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('legal', 'financial', 'health', 'personal')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create wishes table
CREATE TABLE IF NOT EXISTS wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medical', 'funeral', 'personal_message', 'item_distribution')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  recipient_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own wishes"
  ON wishes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create executors table
CREATE TABLE IF NOT EXISTS executors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE executors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own executors"
  ON executors
  FOR ALL
  TO authenticated
  USING (auth.uid() = planner_id);

-- Create trigger_events table
CREATE TABLE IF NOT EXISTS trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('incapacitation', 'death')),
  verification_method TEXT NOT NULL CHECK (verification_method IN ('professional', 'manual')),
  verification_details TEXT,
  triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trigger_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own trigger_events"
  ON trigger_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create activity_log table for audit trails
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity logs"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create executor_access table to track when executors access planner data
CREATE TABLE IF NOT EXISTS executor_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executor_id UUID NOT NULL REFERENCES executors(id) ON DELETE CASCADE,
  planner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE executor_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access to their data"
  ON executor_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = planner_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wishes_updated_at
BEFORE UPDATE ON wishes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_executors_updated_at
BEFORE UPDATE ON executors
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trigger_events_updated_at
BEFORE UPDATE ON trigger_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at();