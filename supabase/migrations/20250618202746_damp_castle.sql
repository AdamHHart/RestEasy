/*
  # Add contact/representative fields to assets and documents

  1. Changes
    - Add contact_name, contact_email, contact_phone, contact_organization to assets table
    - Add contact_name, contact_email, contact_phone, contact_organization to documents table
    - Add 'will' type to wishes table type constraint

  2. Security
    - No changes to RLS policies needed
*/

-- Add contact fields to assets table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' 
    AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE assets 
    ADD COLUMN contact_name text,
    ADD COLUMN contact_email text,
    ADD COLUMN contact_phone text,
    ADD COLUMN contact_organization text;
  END IF;
END $$;

-- Add contact fields to documents table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE documents 
    ADD COLUMN contact_name text,
    ADD COLUMN contact_email text,
    ADD COLUMN contact_phone text,
    ADD COLUMN contact_organization text;
  END IF;
END $$;

-- Update wishes table to include 'will' type
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE wishes DROP CONSTRAINT IF EXISTS wishes_type_check;
  
  -- Add the new constraint with 'will' included
  ALTER TABLE wishes ADD CONSTRAINT wishes_type_check 
    CHECK (type IN ('medical', 'funeral', 'personal_message', 'item_distribution', 'will'));
END $$;