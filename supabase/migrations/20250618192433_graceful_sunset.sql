/*
  # Create checklist system tables

  1. New Tables
    - `checklist_templates`
      - `id` (uuid, primary key)
      - `category` (text) - Category of the checklist item (assets, documents, wishes, etc.)
      - `title` (text) - Title of the checklist item
      - `description` (text) - Description of what needs to be done
      - `priority` (text) - Priority level (high, medium, low)
      - `estimated_time` (text) - Estimated time to complete
      - `required_documents` (text[]) - List of required documents
      - `helpful_tips` (text[]) - Helpful tips for completing the task
      - `order_index` (integer) - Order within category
      - `asset_type` (text) - Optional asset type filter
      - `concern` (text) - Optional concern filter
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_checklists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `template_id` (uuid, foreign key to checklist_templates)
      - `category` (text) - Category of the checklist item
      - `title` (text) - Title of the checklist item
      - `description` (text) - Description of what needs to be done
      - `priority` (text) - Priority level (high, medium, low)
      - `estimated_time` (text) - Estimated time to complete
      - `required_documents` (text[]) - List of required documents
      - `helpful_tips` (text[]) - Helpful tips for completing the task
      - `completed` (boolean) - Whether the item is completed
      - `completed_at` (timestamp) - When the item was completed
      - `order_index` (integer) - Order within category
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for checklist_templates (public read access)
    - Add policies for user_checklists (users can manage their own)

  3. Sample Data
    - Insert initial checklist templates for common planning tasks
*/

-- Create checklist_templates table
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  estimated_time text NOT NULL,
  required_documents text[] DEFAULT '{}',
  helpful_tips text[] DEFAULT '{}',
  order_index integer NOT NULL,
  asset_type text,
  concern text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to templates
CREATE POLICY "Allow public read access to checklist templates"
  ON checklist_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_checklists table
CREATE TABLE IF NOT EXISTS user_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES checklist_templates(id) ON DELETE SET NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  estimated_time text NOT NULL,
  required_documents text[] DEFAULT '{}',
  helpful_tips text[] DEFAULT '{}',
  completed boolean DEFAULT false,
  completed_at timestamptz,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_checklists ENABLE ROW LEVEL SECURITY;

-- Create policies for user_checklists
CREATE POLICY "Users can read own checklists"
  ON user_checklists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklists"
  ON user_checklists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklists"
  ON user_checklists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checklists"
  ON user_checklists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert initial checklist templates
INSERT INTO checklist_templates (category, title, description, priority, estimated_time, required_documents, helpful_tips, order_index, asset_type, concern) VALUES
('assets', 'Document Bank Accounts', 'Gather details for all bank accounts (checking, savings, money market).', 'high', '1 hour', '{"Bank statements", "Account numbers", "Online login details"}', '{"Consolidate accounts if possible", "Ensure beneficiaries are designated"}', 1, 'financial', 'family_security'),
('assets', 'List Investment Accounts', 'Compile information for brokerage, retirement, and other investment accounts.', 'high', '1 hour', '{"Investment statements", "Account numbers", "Online login details"}', '{"Review investment strategies", "Understand tax implications"}', 2, 'financial', 'asset_distribution'),
('assets', 'Document Property Assets', 'Record details of real estate, vehicles, and valuable personal property.', 'high', '2 hours', '{"Property deeds", "Vehicle titles", "Appraisals"}', '{"Keep documents in a safe place", "Update valuations regularly"}', 3, 'property', 'asset_distribution'),
('assets', 'Inventory Digital Assets', 'List all online accounts, cryptocurrencies, and digital subscriptions.', 'medium', '1 hour', '{"Account usernames", "Website URLs", "Password manager details"}', '{"Use a secure password manager", "Provide access instructions to trusted person"}', 4, 'digital', 'digital_legacy'),
('assets', 'Document Business Interests', 'Record details of business ownership, partnerships, and professional assets.', 'medium', '2 hours', '{"Business agreements", "Partnership documents", "Valuation reports"}', '{"Consult with business attorney", "Plan for business succession"}', 5, 'business', 'asset_distribution'),

('documents', 'Locate Your Will', 'Ensure your last will and testament is up-to-date and its location is known.', 'high', '30 minutes', '{"Original will document"}', '{"Store in fireproof safe or with attorney", "Inform executor of location"}', 6, NULL, 'documentation'),
('documents', 'Gather Insurance Policies', 'Collect life, health, home, and auto insurance policy details.', 'medium', '1 hour', '{"Policy documents", "Policy numbers", "Contact information"}', '{"Review coverage annually", "Ensure beneficiaries are current"}', 7, NULL, 'family_security'),
('documents', 'Organize Financial Documents', 'Collect and organize all important financial paperwork and statements.', 'medium', '2 hours', '{"Tax returns", "Financial statements", "Loan documents"}', '{"Create a filing system", "Keep digital copies"}', 8, NULL, 'documentation'),
('documents', 'Secure Legal Documents', 'Gather powers of attorney, trusts, and other legal documents.', 'high', '1 hour', '{"Power of attorney", "Trust documents", "Legal agreements"}', '{"Store originals safely", "Provide copies to relevant parties"}', 9, NULL, 'documentation'),

('wishes', 'Outline Medical Directives', 'Document your preferences for medical care and end-of-life treatment.', 'high', '1 hour', '{"Advance directive form", "Healthcare power of attorney"}', '{"Discuss with family and healthcare providers", "Keep copies accessible"}', 10, NULL, 'medical_wishes'),
('wishes', 'Plan Funeral Preferences', 'Record your wishes for funeral or memorial services, burial, or cremation.', 'medium', '1 hour', '{"Funeral home contact", "Specific music/readings", "Disposition method"}', '{"Communicate wishes to family", "Consider pre-paying for services"}', 11, NULL, 'funeral_arrangements'),
('wishes', 'Write Personal Messages', 'Create meaningful messages for loved ones to receive after your passing.', 'medium', '2 hours', '{"Letter templates", "Contact information"}', '{"Be specific about recipients", "Include personal memories"}', 12, NULL, 'family_security'),
('wishes', 'Document Personal Items Distribution', 'Specify who should receive sentimental items and personal belongings.', 'low', '1 hour', '{"Item descriptions", "Recipient preferences"}', '{"Be specific to avoid conflicts", "Include photos of items"}', 13, 'personal', 'asset_distribution'),

('executors', 'Designate Primary Executor', 'Choose a trusted individual to manage your estate and carry out your wishes.', 'high', '30 minutes', '{"Executor full name", "Contact information"}', '{"Discuss the role with chosen executor", "Ensure they are willing and capable"}', 14, NULL, 'family_security'),
('executors', 'Choose Backup Executor', 'Select an alternate executor in case your primary choice is unable to serve.', 'medium', '15 minutes', '{"Backup executor details", "Contact information"}', '{"Choose someone with different skills", "Inform both executors of their roles"}', 15, NULL, 'family_security'),
('executors', 'Provide Executor Instructions', 'Create detailed instructions for your executor about your wishes and important information.', 'medium', '1 hour', '{"Contact lists", "Account information", "Special instructions"}', '{"Be thorough but clear", "Update instructions regularly"}', 16, NULL, 'family_security'),

('legal', 'Review Estate Plan', 'Periodically review your entire estate plan to ensure it reflects current wishes.', 'low', '2 hours', '{"All legal documents"}', '{"Consult with estate planning attorney regularly", "Update beneficiaries as needed"}', 17, NULL, NULL),
('legal', 'Update Beneficiaries', 'Review and update beneficiaries on all accounts and policies.', 'medium', '1 hour', '{"Account statements", "Policy documents"}', '{"Check beneficiaries annually", "Ensure contingent beneficiaries are named"}', 18, NULL, 'family_security'),
('legal', 'Consider Tax Planning', 'Review estate tax implications and consider strategies to minimize tax burden.', 'low', '2 hours', '{"Tax documents", "Estate valuation"}', '{"Consult with tax professional", "Consider gifting strategies"}', 19, NULL, 'asset_distribution');