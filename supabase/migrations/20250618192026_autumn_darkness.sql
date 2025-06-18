/*
  # Fix Executor Status Update

  1. Changes
    - Update executor status when invitation is accepted
    - Ensure proper status tracking

  2. Security
    - Maintain existing RLS policies
*/

-- Function to handle executor invitation acceptance
CREATE OR REPLACE FUNCTION handle_executor_acceptance(
  invitation_token text,
  user_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record record;
  executor_record record;
  result json;
BEGIN
  -- Get invitation details
  SELECT ei.*, e.id as executor_id, e.name, e.email, e.planner_id
  INTO invitation_record
  FROM executor_invitations ei
  JOIN executors e ON ei.executor_id = e.id
  WHERE ei.token = invitation_token
  AND ei.expires_at > now();

  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if email matches
  IF invitation_record.email != user_email THEN
    RETURN json_build_object('success', false, 'error', 'Email mismatch');
  END IF;

  -- Update executor status to active
  UPDATE executors 
  SET status = 'active', updated_at = now()
  WHERE id = invitation_record.executor_id;

  -- Delete the invitation token
  DELETE FROM executor_invitations 
  WHERE token = invitation_token;

  -- Log the acceptance
  INSERT INTO activity_log (user_id, action_type, details)
  VALUES (
    invitation_record.planner_id,
    'executor_accepted',
    'Executor ' || invitation_record.name || ' accepted invitation'
  );

  RETURN json_build_object(
    'success', true, 
    'message', 'Executor invitation accepted successfully'
  );
END;
$$;