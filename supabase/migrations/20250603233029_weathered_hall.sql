/*
  # Wishes Documentation System

  1. New Tables
    - `medical_directives`
      - Healthcare wishes
      - Emergency contacts
      - Document references
    - `funeral_preferences`
      - Service preferences
      - Specific wishes
    - `personal_messages`
      - Message content
      - Recipient information
      - Delivery conditions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create medical_directives table
CREATE TABLE IF NOT EXISTS medical_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  healthcare_wishes text NOT NULL,
  organ_donation_preference text CHECK (organ_donation_preference IN ('yes', 'no', 'specific_organs')),
  organ_donation_details text,
  resuscitation_preference text CHECK (resuscitation_preference IN ('full_code', 'dnr', 'specific_conditions')),
  resuscitation_details text,
  life_support_preference text CHECK (life_support_preference IN ('all_measures', 'limited', 'comfort_only')),
  life_support_details text,
  document_ids text[],
  emergency_contacts jsonb[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medical_directives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own medical directives"
  ON medical_directives
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create funeral_preferences table
CREATE TABLE IF NOT EXISTS funeral_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type text CHECK (service_type IN ('traditional', 'celebration_of_life', 'memorial', 'private', 'other')),
  disposition_method text CHECK (disposition_method IN ('burial', 'cremation', 'green_burial', 'donation', 'other')),
  location_preference text,
  music_preferences text[],
  readings_preferences text[],
  flowers_preference text CHECK (flowers_preference IN ('yes', 'no', 'specific')),
  flowers_details text,
  other_wishes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE funeral_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own funeral preferences"
  ON funeral_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create personal_messages table
CREATE TABLE IF NOT EXISTS personal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  relationship text,
  subject text NOT NULL,
  content text NOT NULL,
  trigger_event_id uuid REFERENCES trigger_events(id) ON DELETE SET NULL,
  delivery_conditions jsonb,
  draft boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE personal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own personal messages"
  ON personal_messages
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_medical_directives_updated_at
  BEFORE UPDATE ON medical_directives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_funeral_preferences_updated_at
  BEFORE UPDATE ON funeral_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_personal_messages_updated_at
  BEFORE UPDATE ON personal_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();