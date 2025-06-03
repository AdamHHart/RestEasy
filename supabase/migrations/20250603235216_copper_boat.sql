/*
  # Add executor tasks and templates

  1. New Tables
    - `executor_tasks`
      - Generated tasks for executors
      - Includes priority, status, and estimated completion time
    - `task_templates`
      - Pre-defined task templates for different asset types
      - Used by AI to generate personalized tasks
    
  2. Security
    - Enable RLS on new tables
    - Add policies for executors to access their tasks
*/

-- Task templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  estimated_time text NOT NULL,
  required_documents text[],
  required_contacts jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to task templates"
  ON task_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Executor tasks table
CREATE TABLE IF NOT EXISTS executor_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executor_id uuid REFERENCES executors(id) ON DELETE CASCADE,
  template_id uuid REFERENCES task_templates(id),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('financial', 'legal', 'personal', 'digital')),
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  estimated_time text NOT NULL,
  documents text[],
  contacts jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE executor_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Executors can view assigned tasks"
  ON executor_tasks
  FOR SELECT
  TO authenticated
  USING (
    executor_id IN (
      SELECT id FROM executors WHERE id = executor_id
    )
  );

CREATE POLICY "Executors can update assigned tasks"
  ON executor_tasks
  FOR UPDATE
  TO authenticated
  USING (
    executor_id IN (
      SELECT id FROM executors WHERE id = executor_id
    )
  )
  WITH CHECK (
    executor_id IN (
      SELECT id FROM executors WHERE id = executor_id
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_executor_tasks_updated_at
  BEFORE UPDATE ON executor_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert some initial task templates
INSERT INTO task_templates (asset_type, title, description, priority, estimated_time, required_documents, required_contacts) VALUES
  (
    'financial',
    'Contact deceased''s bank',
    'Notify the bank of the death and inquire about accounts, safe deposit boxes, and required documentation.',
    'high',
    '1-2 hours',
    ARRAY['Death Certificate', 'Letters of Administration'],
    '[{"role": "Bank Representative", "details": "Main branch of deceased''s bank"}]'::jsonb
  ),
  (
    'financial',
    'Locate and review insurance policies',
    'Identify all insurance policies (life, health, property) and initiate claims process.',
    'high',
    '2-3 hours',
    ARRAY['Death Certificate', 'Insurance Policy Documents'],
    '[{"role": "Insurance Agent", "details": "Contact information in policy documents"}]'::jsonb
  ),
  (
    'legal',
    'File for probate',
    'Prepare and file necessary documentation with the probate court.',
    'high',
    '4-6 hours',
    ARRAY['Death Certificate', 'Will', 'Asset Inventory'],
    '[{"role": "Probate Attorney", "details": "Legal representation for estate"}]'::jsonb
  ),
  (
    'digital',
    'Secure digital assets',
    'Identify and secure access to important digital accounts and assets.',
    'medium',
    '2-3 hours',
    ARRAY['Digital Asset Inventory', 'Account Access Information'],
    '[{"role": "IT Professional", "details": "If needed for account recovery"}]'::jsonb
  ),
  (
    'personal',
    'Notify government agencies',
    'Inform Social Security, Medicare, and other relevant government agencies.',
    'high',
    '2-3 hours',
    ARRAY['Death Certificate', 'Social Security Card'],
    '[{"role": "Government Representative", "details": "Local Social Security office"}]'::jsonb
  );