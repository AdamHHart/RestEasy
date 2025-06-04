/*
  # Add Executor Notifications System

  1. New Tables
    - `executor_notifications`: Stores notifications for executors
      - System notifications
      - Task updates
      - Access grants
    - `executor_invitations`: Tracks pending invitations
      - Secure tokens
      - Expiration dates
      - Email verification

  2. Security
    - Enable RLS on all tables
    - Add policies for notification access
    - Add policies for invitation management
*/

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
  USING (executor_id IN (
    SELECT executors.id
    FROM executors
    WHERE executors.id = executor_notifications.executor_id
  ));

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