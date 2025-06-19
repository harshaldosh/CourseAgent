/*
  # Fix Quiz RLS Policies

  1. Security Updates
    - Drop existing problematic policies on quizzes table
    - Create new policies that work with the current schema
    - Ensure proper access control for quiz creation and management

  2. Changes
    - Remove policies that reference non-existent 'users' table
    - Add policies that use 'profiles' table and auth.users() properly
    - Allow authenticated users to create quizzes
    - Allow admin users (based on email) to manage all quizzes
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins can manage all quizzes" ON quizzes;
DROP POLICY IF EXISTS "Anyone can view quizzes by ID" ON quizzes;
DROP POLICY IF EXISTS "Users can create their own quizzes" ON quizzes;

-- Create new policies that work with the current schema
CREATE POLICY "Allow authenticated users to create quizzes"
  ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow quiz creators to manage their quizzes"
  ON quizzes
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow admin to manage all quizzes"
  ON quizzes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'harshal9901@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'harshal9901@gmail.com'
    )
  );

CREATE POLICY "Allow public to view quizzes"
  ON quizzes
  FOR SELECT
  TO public
  USING (true);