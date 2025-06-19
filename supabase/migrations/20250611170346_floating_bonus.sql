/*
  # Fix RLS policies for anonymous access

  1. Security Changes
    - Update RLS policies on `courses` table to allow anonymous users
    - Update RLS policies on `chapters` table to allow anonymous users  
    - Update RLS policies on `videos` table to allow anonymous users
    
  2. Notes
    - This allows anonymous users to perform CRUD operations on course data
    - Consider implementing proper authentication if this is a production application
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations on courses" ON courses;
DROP POLICY IF EXISTS "Allow all operations on chapters" ON chapters;
DROP POLICY IF EXISTS "Allow all operations on videos" ON videos;

-- Create new policies that allow anonymous access
CREATE POLICY "Allow all operations on courses for everyone"
  ON courses
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on chapters for everyone"
  ON chapters
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on videos for everyone"
  ON videos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);