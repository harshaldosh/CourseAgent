/*
  # Fix Quiz Creation Permissions

  1. Security Updates
    - Add RLS policy to allow authenticated users to create quizzes
    - Ensure users can only create quizzes with their own user ID as created_by

  This migration addresses the "permission denied" error when creating quizzes
  by adding appropriate INSERT permissions for authenticated users.
*/

-- Add policy to allow authenticated users to create their own quizzes
CREATE POLICY "Users can create their own quizzes"
  ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);