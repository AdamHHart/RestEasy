/*
  # Fix Profiles Table RLS Policies

  1. Changes
    - Add INSERT policy for authenticated users to create their own profile
    - Update SELECT policy to allow users to read their own profile
    - Update UPDATE policy to allow users to update their own profile
  
  2. Security
    - Ensures users can only access and modify their own profile data
    - Maintains data isolation between users
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive policies for the profiles table
CREATE POLICY "Enable insert for authenticated users only"
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users based on user_id"
ON profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);