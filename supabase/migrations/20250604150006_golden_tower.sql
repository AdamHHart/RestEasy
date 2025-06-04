/*
  # Add executor_id to trigger_events table

  1. Changes
    - Add `executor_id` column to `trigger_events` table
    - Add foreign key constraint to reference executors table
    - Update TriggerEvent type definition

  2. Security
    - No changes to RLS policies needed
*/

-- Add executor_id column
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trigger_events' 
    AND column_name = 'executor_id'
  ) THEN
    ALTER TABLE trigger_events 
    ADD COLUMN executor_id uuid REFERENCES executors(id) ON DELETE SET NULL;
  END IF;
END $$;