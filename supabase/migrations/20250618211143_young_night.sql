/*
  # Fix RLS policies for executor death certificate upload

  1. Storage Policies
    - Allow executors to upload death certificates to documents bucket
  
  2. Database Policies  
    - Allow executors to insert documents for planners they manage
    - Allow executors to update trigger events for planners they manage
    - Allow executors to insert activity logs

  3. Security
    - Ensure executors can only access data for planners they are assigned to
    - Maintain data integrity and access control
*/

-- Storage policy for death certificate uploads
CREATE POLICY "Executors can upload death certificates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' 
    AND name LIKE 'death-certificates/%'
    AND EXISTS (
      SELECT 1 FROM executors 
      WHERE executors.email = auth.email()
      AND executors.status = 'active'
      AND executors.planner_id::text = split_part(name, '/', 2)
    )
  );

-- Allow executors to view death certificates they uploaded
CREATE POLICY "Executors can view death certificates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND name LIKE 'death-certificates/%'
    AND EXISTS (
      SELECT 1 FROM executors 
      WHERE executors.email = auth.email()
      AND executors.status = 'active'
      AND executors.planner_id::text = split_part(name, '/', 2)
    )
  );

-- Allow executors to insert documents for planners they manage
CREATE POLICY "Executors can insert documents for managed planners"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM executors 
      WHERE executors.email = auth.email()
      AND executors.status = 'active'
      AND executors.planner_id = documents.user_id
    )
  );

-- Allow executors to view documents for planners they manage
CREATE POLICY "Executors can view documents for managed planners"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM executors 
      WHERE executors.email = auth.email()
      AND executors.status = 'active'
      AND executors.planner_id = documents.user_id
    )
  );

-- Allow executors to update trigger events for planners they manage
CREATE POLICY "Executors can update trigger events for managed planners"
  ON trigger_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM executors 
      WHERE executors.email = auth.email()
      AND executors.status = 'active'
      AND executors.planner_id = trigger_events.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM executors 
      WHERE executors.email = auth.email()
      AND executors.status = 'active'
      AND executors.planner_id = trigger_events.user_id
    )
  );

-- Allow executors to insert trigger events for planners they manage
CREATE POLICY "Executors can insert trigger events for managed planners"
  ON trigger_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM executors 
      WHERE executors.email = auth.email()
      AND executors.status = 'active'
      AND executors.planner_id = trigger_events.user_id
    )
  );

-- Allow executors to view trigger events for planners they manage
CREATE POLICY "Executors can view trigger events for managed planners"
  ON trigger_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM executors 
      WHERE executors.email = auth.email()
      AND executors.status = 'active'
      AND executors.planner_id = trigger_events.user_id
    )
  );

-- Allow any authenticated user to insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);