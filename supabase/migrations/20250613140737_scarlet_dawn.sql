/*
  # Add new course fields and agents table

  1. Schema Changes
    - Add `agent_course_description` field to `courses` table
    - Add `category` field to `courses` table with enum constraint
    - Add `sponsored` field to `courses` table
    - Create `agents` table for chapter agents

  2. New Tables
    - `agents`
      - `id` (uuid, primary key)
      - `chapter_id` (uuid, foreign key to chapters)
      - `title` (text, not null)
      - `replica_id` (text, not null)
      - `conversational_context` (text, not null)
      - `description` (text, optional)
      - `order_index` (integer, not null, default 0)
      - `created_at` (timestamp with timezone, default now())

  3. Security
    - Enable RLS on `agents` table
    - Add policies for public access (matching existing pattern)

  4. Indexes
    - Add indexes for foreign keys and ordering
*/

-- Add new fields to courses table
DO $$
BEGIN
  -- Add agent_course_description field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'agent_course_description'
  ) THEN
    ALTER TABLE courses ADD COLUMN agent_course_description text;
  END IF;

  -- Add category field with enum constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'category'
  ) THEN
    ALTER TABLE courses ADD COLUMN category text DEFAULT 'Technology';
    ALTER TABLE courses ADD CONSTRAINT courses_category_check 
      CHECK (category IN ('Technology', 'Project Management', 'Finance', 'Sustainability'));
  END IF;

  -- Add sponsored field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'sponsored'
  ) THEN
    ALTER TABLE courses ADD COLUMN sponsored boolean DEFAULT false;
  END IF;
END $$;

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  replica_id text NOT NULL,
  conversational_context text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Create policies for agents (allowing all operations for everyone - matching existing pattern)
CREATE POLICY "Allow all operations on agents for everyone"
  ON agents
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_chapter_id ON agents(chapter_id);
CREATE INDEX IF NOT EXISTS idx_agents_order ON agents(chapter_id, order_index);