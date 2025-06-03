/*
  # Create additional tables and policies

  1. New Tables
    - `trigger_events` for managing trigger conditions
    - `activity_log` for audit trail
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
  3. Triggers
    - Add updated_at triggers for timestamp management
*/

-- Create trigger_events table if it doesn't exist
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

-- Enable RLS and create policy for trigger_events
ALTER TABLE trigger_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trigger_events' 
    AND policyname = 'Users can CRUD own trigger_events'
  ) THEN
    CREATE POLICY "Users can CRUD own trigger_events"
      ON trigger_events
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  details text,
  ip_address text,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS and create policy for activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_log' 
    AND policyname = 'Users can read own activity logs'
  ) THEN
    CREATE POLICY "Users can read own activity logs"
      ON activity_log
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_trigger_events_updated_at'
  ) THEN
    CREATE TRIGGER update_trigger_events_updated_at
      BEFORE UPDATE ON trigger_events
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;