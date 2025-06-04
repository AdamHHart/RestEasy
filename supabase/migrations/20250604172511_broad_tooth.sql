/*
  # Complete Database Schema Setup

  1. New Tables
    - executors
    - trigger_events
    - activity_log

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Set up foreign key relationships

  3. Changes
    - Add status check constraint to executors
*/

-- Create executors table
CREATE TABLE IF NOT EXISTS executors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  relationship text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'revoked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE executors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own executors"
  ON executors
  FOR ALL
  TO authenticated
  USING (auth.uid() = planner_id)
  WITH CHECK (auth.uid() = planner_id);

-- Create trigger_events table
CREATE TABLE IF NOT EXISTS trigger_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('incapacitation', 'death')),
  verification_method text NOT NULL
    CHECK (verification_method IN ('professional', 'manual')),
  verification_details text,
  triggered boolean DEFAULT false,
  triggered_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trigger_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own trigger_events"
  ON trigger_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  details text,
  ip_address text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity logs"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_executors_updated_at
  BEFORE UPDATE ON executors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trigger_events_updated_at
  BEFORE UPDATE ON trigger_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();