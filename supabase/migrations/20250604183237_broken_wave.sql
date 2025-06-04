/*
  # Fix Database Schema and Policies

  1. Changes
    - Add executor notifications table
    - Add AI task templates and executor tasks
    - Add proper policies and constraints
    - Remove duplicate definitions

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create executor_notifications table if not exists
CREATE TABLE IF NOT EXISTS executor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executor_id uuid REFERENCES executors(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE executor_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Executors can view assigned notifications" ON executor_notifications;

CREATE POLICY "Executors can view assigned notifications"
  ON executor_notifications
  FOR ALL
  TO authenticated
  USING (executor_id IN (
    SELECT id FROM executors WHERE id = executor_notifications.executor_id
  ));

-- Create AI task templates table if not exists
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

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Allow read access to AI task templates" ON ai_task_templates;

CREATE POLICY "Allow read access to AI task templates"
  ON ai_task_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create AI executor tasks table if not exists
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

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Executors can view assigned tasks" ON ai_executor_tasks;
DROP POLICY IF EXISTS "Executors can update assigned tasks" ON ai_executor_tasks;

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

-- Create AI action logs table if not exists
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

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Executors can view task logs" ON ai_action_logs;

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
DROP TRIGGER IF EXISTS update_ai_executor_tasks_updated_at ON ai_executor_tasks;

CREATE TRIGGER update_ai_executor_tasks_updated_at
  BEFORE UPDATE ON ai_executor_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();