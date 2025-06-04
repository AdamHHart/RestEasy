/*
  # AI Agent Foundation Schema

  1. New Tables
    - ai_task_templates: Predefined AI task templates
    - ai_executor_tasks: Generated tasks for executors
    - ai_action_logs: Audit trail of AI actions

  2. Security
    - Enable RLS on all tables
    - Add policies for task access
    - Set up proper audit logging
*/

-- Create ai_task_templates table
CREATE TABLE IF NOT EXISTS ai_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text CHECK (category IN ('financial', 'digital', 'legal', 'personal', 'communication')),
  prompt_template text NOT NULL,
  required_data jsonb NOT NULL,
  estimated_duration text NOT NULL,
  fee_cents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to AI task templates"
  ON ai_task_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create ai_executor_tasks table
CREATE TABLE IF NOT EXISTS ai_executor_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executor_id uuid REFERENCES executors(id) ON DELETE CASCADE,
  planner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES ai_task_templates(id),
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'ai_processing', 'completed', 'self_managed', 'cancelled')),
  ai_context jsonb,
  ai_result jsonb,
  executor_notes text,
  fee_cents integer DEFAULT 0,
  approved_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_executor_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Executors can view assigned tasks"
  ON ai_executor_tasks
  FOR SELECT
  TO authenticated
  USING (
    executor_id IN (
      SELECT id FROM executors WHERE id = ai_executor_tasks.executor_id
    )
  );

CREATE POLICY "Executors can update assigned tasks"
  ON ai_executor_tasks
  FOR UPDATE
  TO authenticated
  USING (
    executor_id IN (
      SELECT id FROM executors WHERE id = ai_executor_tasks.executor_id
    )
  )
  WITH CHECK (
    executor_id IN (
      SELECT id FROM executors WHERE id = ai_executor_tasks.executor_id
    )
  );

-- Create ai_action_logs table
CREATE TABLE IF NOT EXISTS ai_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES ai_executor_tasks(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_details jsonb,
  openai_request jsonb,
  openai_response jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Executors can view task logs"
  ON ai_action_logs
  FOR SELECT
  TO authenticated
  USING (
    task_id IN (
      SELECT id FROM ai_executor_tasks 
      WHERE executor_id IN (
        SELECT id FROM executors WHERE id = ai_executor_tasks.executor_id
      )
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_ai_executor_tasks_updated_at
  BEFORE UPDATE ON ai_executor_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert initial task templates
INSERT INTO ai_task_templates (
  name,
  description,
  category,
  prompt_template,
  required_data,
  estimated_duration,
  fee_cents
) VALUES
(
  'Bank Death Notification',
  'Generate a formal letter notifying the bank of the account holder''s passing and requesting next steps',
  'financial',
  'You are assisting an executor with notifying a bank about an account holder''s passing. Using the provided information, generate a formal letter that: 1) Notifies the bank of the death 2) Provides necessary account details 3) Requests information about next steps 4) Includes executor contact information. Keep the tone professional and respectful.',
  '{
    "required": ["bank_name", "account_number", "death_date", "death_certificate_number"],
    "optional": ["branch_address", "account_type"]
  }',
  '30 minutes',
  1500
),
(
  'Social Media Memorial Post',
  'Create a thoughtful memorial post for social media platforms based on provided preferences',
  'digital',
  'Create a memorial social media post that honors the deceased''s memory. Use the provided tone preference and incorporate any specific messages or memories requested. The post should be respectful and align with the platform''s conventions while maintaining dignity.',
  '{
    "required": ["platform", "tone_preference", "key_memories"],
    "optional": ["final_message", "photo_preferences"]
  }',
  '20 minutes',
  1000
),
(
  'Insurance Claim Initiation',
  'Prepare insurance claim documentation and generate a cover letter',
  'financial',
  'Generate a comprehensive insurance claim package including: 1) A formal cover letter 2) A checklist of required documentation 3) Instructions for submission. Ensure all policy-specific details are incorporated and requirements are clearly explained.',
  '{
    "required": ["policy_number", "insurance_company", "policy_type", "death_certificate_number"],
    "optional": ["beneficiary_details", "agent_contact"]
  }',
  '45 minutes',
  2000
);