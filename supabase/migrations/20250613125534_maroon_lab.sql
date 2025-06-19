/*
  # Course Enrollments Table

  1. New Tables
    - `enrollments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `course_id` (uuid, foreign key to courses)
      - `enrolled_at` (timestamp with timezone, default now())
      - `completed_at` (timestamp with timezone, nullable)
      - `progress` (jsonb, for storing video completion data)

  2. Security
    - Enable RLS on `enrollments` table
    - Users can only see/modify their own enrollments
    - Add unique constraint on user_id + course_id

  3. Indexes
    - Add indexes for user_id and course_id lookups
*/

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress jsonb DEFAULT '{}',
  UNIQUE(user_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments"
  ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON enrollments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments"
  ON enrollments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);