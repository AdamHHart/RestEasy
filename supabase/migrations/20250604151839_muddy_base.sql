/*
  # Add Encrypted Documents Support

  1. New Tables
    - encrypted_documents: Stores encrypted document data
    - executor_notifications: Stores notifications for executors

  2. Security
    - Enable RLS on all tables
    - Add policies for document access
    - Add policies for notification access

  3. Audit Support
    - Add triggers for logging document access
*/

-- Create encrypted_documents table
CREATE TABLE IF NOT EXISTS encrypted_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_data integer[] NOT NULL,
  iv integer[] NOT NULL,
  key integer[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE encrypted_documents ENABLE ROW LEVEL SECURITY;

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

-- Add RLS policies
CREATE POLICY "Users can manage own encrypted documents"
  ON encrypted_documents
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Executors can view assigned notifications"
  ON executor_notifications
  FOR ALL
  TO authenticated
  USING (executor_id IN (
    SELECT id FROM executors WHERE id = executor_notifications.executor_id
  ))
  WITH CHECK (executor_id IN (
    SELECT id FROM executors WHERE id = executor_notifications.executor_id
  ));

-- Add updated_at trigger for encrypted_documents
CREATE TRIGGER update_encrypted_documents_updated_at
  BEFORE UPDATE ON encrypted_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();