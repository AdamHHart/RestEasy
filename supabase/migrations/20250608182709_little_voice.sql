/*
  # Onboarding Checklist System

  1. New Tables
    - `user_checklists`
      - Stores personalized checklists generated from onboarding
      - Tracks completion status of each item
    - `checklist_templates`
      - Predefined checklist items for different scenarios
      - Used to generate personalized checklists

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create checklist_templates table
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('assets', 'documents', 'wishes', 'executors', 'legal')),
  asset_type text, -- For asset-specific items
  concern text, -- For concern-specific items
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  estimated_time text NOT NULL,
  required_documents text[],
  helpful_tips text[],
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to checklist templates"
  ON checklist_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_checklists table
CREATE TABLE IF NOT EXISTS user_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES checklist_templates(id),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL,
  estimated_time text NOT NULL,
  required_documents text[],
  helpful_tips text[],
  completed boolean DEFAULT false,
  completed_at timestamptz,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checklists"
  ON user_checklists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_checklists_updated_at
  BEFORE UPDATE ON user_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert checklist templates
INSERT INTO checklist_templates (category, asset_type, concern, title, description, priority, estimated_time, required_documents, helpful_tips, order_index) VALUES

-- Asset-related templates
('assets', 'financial', NULL, 'Document Bank Accounts', 'List all checking, savings, and money market accounts with account numbers and institutions.', 'high', '30 minutes', ARRAY['Recent bank statements', 'Account numbers'], ARRAY['Include online-only accounts', 'Don''t forget credit union accounts'], 1),

('assets', 'financial', NULL, 'Record Investment Accounts', 'Document all investment accounts including 401(k), IRA, brokerage accounts, and retirement plans.', 'high', '45 minutes', ARRAY['Investment statements', 'Beneficiary forms'], ARRAY['Include employer-sponsored plans', 'Note any automatic contributions'], 2),

('assets', 'financial', NULL, 'List Insurance Policies', 'Record all insurance policies including life, health, auto, home, and disability insurance.', 'high', '30 minutes', ARRAY['Insurance policy documents', 'Premium payment records'], ARRAY['Include group policies through work', 'Note beneficiaries for each policy'], 3),

('assets', 'property', NULL, 'Document Real Estate', 'List all real estate properties including primary residence, vacation homes, and rental properties.', 'high', '20 minutes', ARRAY['Property deeds', 'Mortgage statements'], ARRAY['Include property tax information', 'Note any liens or encumbrances'], 4),

('assets', 'property', NULL, 'Record Valuable Personal Items', 'Document jewelry, art, collectibles, and other valuable personal property.', 'medium', '45 minutes', ARRAY['Appraisals', 'Purchase receipts'], ARRAY['Consider professional appraisals for valuable items', 'Take photos for documentation'], 5),

('assets', 'digital', NULL, 'List Digital Assets', 'Document cryptocurrency, online accounts, digital media, and other digital assets.', 'medium', '30 minutes', ARRAY['Account information', 'Recovery keys'], ARRAY['Include social media accounts', 'Store recovery information securely'], 6),

-- Document-related templates
('documents', NULL, NULL, 'Upload Will or Trust', 'Upload your current will, trust documents, or estate planning documents.', 'high', '10 minutes', ARRAY['Will', 'Trust documents', 'Codicils'], ARRAY['Ensure documents are current', 'Include any amendments'], 1),

('documents', NULL, NULL, 'Upload Power of Attorney', 'Upload financial and healthcare power of attorney documents.', 'high', '10 minutes', ARRAY['Financial POA', 'Healthcare POA'], ARRAY['Ensure documents are properly executed', 'Include HIPAA authorizations'], 2),

('documents', NULL, NULL, 'Upload Birth Certificate', 'Upload certified copy of birth certificate for identity verification.', 'medium', '5 minutes', ARRAY['Certified birth certificate'], ARRAY['Certified copies are preferred', 'Keep originals in safe place'], 3),

('documents', NULL, NULL, 'Upload Marriage/Divorce Documents', 'Upload marriage certificate or divorce decree as applicable.', 'medium', '5 minutes', ARRAY['Marriage certificate', 'Divorce decree'], ARRAY['Include any prenuptial agreements', 'Ensure documents are certified'], 4),

-- Wishes-related templates
('wishes', NULL, 'medical_wishes', 'Create Medical Directives', 'Document your healthcare wishes and create advance directives.', 'high', '30 minutes', ARRAY['Healthcare proxy form', 'Living will'], ARRAY['Discuss with family members', 'Consider consulting with doctor'], 1),

('wishes', NULL, 'funeral_arrangements', 'Document Funeral Preferences', 'Record your preferences for funeral or memorial services.', 'high', '20 minutes', ARRAY[], ARRAY['Consider pre-planning with funeral home', 'Discuss preferences with family'], 2),

('wishes', NULL, 'asset_distribution', 'Create Distribution Instructions', 'Document how you want your assets distributed to beneficiaries.', 'high', '45 minutes', ARRAY['Beneficiary forms', 'Asset inventory'], ARRAY['Be specific about sentimental items', 'Consider tax implications'], 3),

-- Executor-related templates
('executors', NULL, 'family_security', 'Designate Primary Executor', 'Choose and invite a trusted person to serve as your primary executor.', 'high', '15 minutes', ARRAY[], ARRAY['Choose someone organized and trustworthy', 'Discuss responsibilities beforehand'], 1),

('executors', NULL, 'family_security', 'Designate Backup Executor', 'Choose and invite a backup executor in case your primary executor cannot serve.', 'medium', '10 minutes', ARRAY[], ARRAY['Choose someone different from primary', 'Ensure they understand the role'], 2),

-- Legal templates
('legal', NULL, 'documentation', 'Review Legal Documents', 'Ensure all legal documents are current and properly executed.', 'high', '60 minutes', ARRAY['All legal documents'], ARRAY['Consider consulting with attorney', 'Ensure documents comply with state law'], 1),

('legal', NULL, 'documentation', 'Update Beneficiaries', 'Review and update beneficiaries on all accounts and policies.', 'high', '30 minutes', ARRAY['Beneficiary forms'], ARRAY['Update after major life events', 'Ensure contingent beneficiaries are named'], 2);