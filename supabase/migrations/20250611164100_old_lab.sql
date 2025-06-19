/*
  # Course Management Schema

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `image` (text, not null) 
      - `description` (text, not null)
      - `fees` (numeric, not null)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())
    
    - `chapters`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `title` (text, not null)
      - `order_index` (integer, not null, default 0)
      - `created_at` (timestamp with timezone, default now())
    
    - `videos`
      - `id` (uuid, primary key)
      - `chapter_id` (uuid, foreign key to chapters)
      - `title` (text, not null)
      - `url` (text, not null)
      - `duration` (text)
      - `order_index` (integer, not null, default 0)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - For now, allow all operations for authenticated users (can be refined later)

  3. Indexes
    - Add indexes for foreign keys and commonly queried fields
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image text NOT NULL,
  description text NOT NULL,
  fees numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  duration text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - can be refined based on auth requirements)
CREATE POLICY "Allow all operations on courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on chapters"
  ON chapters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on videos"
  ON videos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chapters_course_id ON chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_videos_chapter_id ON videos(chapter_id);
CREATE INDEX IF NOT EXISTS idx_videos_order ON videos(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for courses table
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();