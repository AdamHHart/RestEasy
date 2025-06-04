/*
  # Executor System Enhancement

  1. New Tables
    - `executor_invitations`: Stores pending invitations
    - `executor_notifications`: Notifications for executors
    - `executor_access_logs`: Track executor data access

  2. Security
    - Enable RLS on all tables
    - Add policies for access control
*/

-- Create executor_invitations table
CREATE TABLE IF NOT EXISTS executor_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executor_id uuid REFERENCES executors(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE executor_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own executor invitations"
  ON executor_invitations
  FOR ALL
  TO authenticated
  USING (
    executor_id IN (
      SELECT id FROM executors WHERE planner_id = auth.uid()
    )
  );

-- Create executor_notifications table
CREATE TABLE IF NOT EXISTS executor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executor_id uuid REFERENCES executors(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE executor_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Executors can view assigned notifications"
  ON executor_notifications
  FOR ALL
  TO authenticated
  USING (
    executor_id IN (
      SELECT id FROM executors WHERE id = executor_notifications.executor_id
    )
  );

-- Create executor_access_logs table
CREATE TABLE IF NOT EXISTS executor_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executor_id uuid REFERENCES executors(id) ON DELETE CASCADE,
  planner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  action text NOT NULL,
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE executor_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access to their data"
  ON executor_access_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = planner_id OR 
    executor_id IN (
      SELECT id FROM executors WHERE id = executor_access_logs.executor_id
    )
  );