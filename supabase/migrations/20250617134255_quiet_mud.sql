/*
  # Quiz System Schema

  1. New Tables
    - `quizzes`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `topic` (text)
      - `pdf_url` (text, optional - for PDF-based quizzes)
      - `total_questions` (integer, not null)
      - `total_marks` (integer, not null)
      - `questions` (jsonb, stores quiz questions and options)
      - `evaluation_prompts` (jsonb, additional prompts for LLM evaluation)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())

    - `quiz_attempts`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, foreign key to quizzes)
      - `user_id` (uuid, foreign key to auth.users)
      - `answers` (jsonb, stores user answers)
      - `score` (integer)
      - `total_marks` (integer)
      - `evaluation_result` (jsonb, stores LLM evaluation)
      - `started_at` (timestamp with timezone, default now())
      - `completed_at` (timestamp with timezone)

  2. Security
    - Enable RLS on all tables
    - Admins can manage quizzes
    - Users can only access quizzes via URL and view their own attempts

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  topic text,
  pdf_url text,
  total_questions integer NOT NULL,
  total_marks integer NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  evaluation_prompts jsonb DEFAULT '[]',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '{}',
  score integer,
  total_marks integer,
  evaluation_result jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(quiz_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz policies (Admin only for management, public read via URL)
CREATE POLICY "Admins can manage all quizzes"
  ON quizzes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id IN (
        SELECT id FROM auth.users WHERE email = 'harshal9901@gmail.com'
      )
    )
  );

CREATE POLICY "Anyone can view quizzes by ID"
  ON quizzes
  FOR SELECT
  TO public
  USING (true);

-- Quiz attempt policies
CREATE POLICY "Users can view their own quiz attempts"
  ON quiz_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts"
  ON quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts"
  ON quiz_attempts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
  ON quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id IN (
        SELECT id FROM auth.users WHERE email = 'harshal9901@gmail.com'
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);

-- Create trigger for quizzes updated_at
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();