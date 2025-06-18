/*
  # Fix storage and table policies for executor access

  1. Storage Policies
    - Allow executors to upload death certificates
    - Allow authenticated users to upload to their own folders
    - Allow executors to read documents for managed planners

  2. Document Table Policies
    - Allow executors to insert and view documents for managed planners

  3. Trigger Events Policies
    - Allow executors to manage trigger events for managed planners

  4. Activity Log Policies
    - Allow authenticated users to insert activity logs

  Note: Using DROP IF EXISTS and CREATE to handle existing policies
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Executors can upload death certificates for managed planners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to their own folders" ON storage.objects;
DROP POLICY IF EXISTS "Executors can read documents for managed planners" ON storage.objects;
DROP POLICY IF EXISTS "Executors can insert documents for managed planners" ON documents;
DROP POLICY IF EXISTS "Executors can view documents for managed planners" ON documents;
DROP POLICY IF EXISTS "Executors can insert trigger events for managed planners" ON trigger_events;
DROP POLICY IF EXISTS "Executors can update trigger events for managed planners" ON trigger_events;
DROP POLICY IF EXISTS "Executors can view trigger events for managed planners" ON trigger_events;
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON activity_log;

-- Create storage policies for the documents bucket
CREATE POLICY "Executors can upload death certificates for managed planners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'death-certificates' AND
  EXISTS (
    SELECT 1 FROM executors 
    WHERE executors.email = auth.email() 
    AND executors.status = 'active'
    AND (storage.foldername(name))[2] = executors.planner_id::text
  )
);

CREATE POLICY "Authenticated users can upload to their own folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   (storage.foldername(name))[1] = 'death-certificates')
);

CREATE POLICY "Executors can read documents for managed planners"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (EXISTS (
    SELECT 1 FROM executors 
    WHERE executors.email = auth.email() 
    AND executors.status = 'active'
    AND (storage.foldername(name))[2] = executors.planner_id::text
  ) OR auth.uid()::text = (storage.foldername(name))[1])
);

-- Update document table policies to allow executors to insert documents
CREATE POLICY "Executors can insert documents for managed planners"
ON documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM executors 
    WHERE executors.email = auth.email() 
    AND executors.status = 'active'
    AND executors.planner_id = documents.user_id
  )
);

CREATE POLICY "Executors can view documents for managed planners"
ON documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM executors 
    WHERE executors.email = auth.email() 
    AND executors.status = 'active'
    AND executors.planner_id = documents.user_id
  )
);

-- Update trigger_events table policies to allow executors to insert and update
CREATE POLICY "Executors can insert trigger events for managed planners"
ON trigger_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM executors 
    WHERE executors.email = auth.email() 
    AND executors.status = 'active'
    AND executors.planner_id = trigger_events.user_id
  )
);

CREATE POLICY "Executors can update trigger events for managed planners"
ON trigger_events FOR UPDATE
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

CREATE POLICY "Executors can view trigger events for managed planners"
ON trigger_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM executors 
    WHERE executors.email = auth.email() 
    AND executors.status = 'active'
    AND executors.planner_id = trigger_events.user_id
  )
);

-- Allow authenticated users to insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
ON activity_log FOR INSERT
TO authenticated
WITH CHECK (true);