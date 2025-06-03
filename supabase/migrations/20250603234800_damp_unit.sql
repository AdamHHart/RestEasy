/*
  # Add executor invitations table

  1. New Tables
    - `executor_invitations`
      - `id` (uuid, primary key)
      - `executor_id` (uuid, references executors)
      - `token` (text, unique)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `executor_invitations` table
    - Add policies for authenticated users
*/

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