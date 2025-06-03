/*
  # Onboarding System Setup

  1. New Tables
    - `onboarding_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `age_range` (text)
      - `family_status` (text)
      - `asset_types` (text[])
      - `concerns` (text[])
      - `completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `onboarding_responses` table
    - Add policies for authenticated users to manage their responses
*/

-- Create onboarding_responses table
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  age_range text NOT NULL CHECK (age_range IN ('18-30', '31-50', '51-70', '70+')),
  family_status text NOT NULL CHECK (family_status IN ('single', 'married', 'divorced', 'widowed', 'other')),
  asset_types text[] NOT NULL DEFAULT '{}',
  concerns text[] NOT NULL DEFAULT '{}',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own onboarding responses"
  ON onboarding_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_onboarding_responses_updated_at
  BEFORE UPDATE ON onboarding_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();