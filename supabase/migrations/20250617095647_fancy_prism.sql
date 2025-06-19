/*
  # Create Documents Table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `chapter_id` (uuid, foreign key to chapters)
      - `title` (text, not null)
      - `url` (text, not null)
      - `description` (text, optional)
      - `is_special` (boolean, default false)
      - `order_index` (integer, not null, default 0)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `documents` table
    - Add policies for public access (matching existing pattern)

  3. Indexes
    - Add indexes for foreign keys and ordering
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  is_special boolean DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents (allowing all operations for everyone - matching existing pattern)
CREATE POLICY "Allow all operations on documents for everyone"
  ON documents
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_chapter_id ON documents(chapter_id);
CREATE INDEX IF NOT EXISTS idx_documents_order ON documents(chapter_id, order_index);