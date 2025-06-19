/*
  # Add descriptions and file upload fields

  1. Schema Changes
    - Add `description` field to `chapters` table
    - Add `description` field to `videos` table
    - Add `course_material_url` field to `courses` table for uploaded course materials
    
  2. Notes
    - These fields are optional and can be null
    - File URLs will be stored as text (Supabase storage URLs)
*/

-- Add description field to chapters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapters' AND column_name = 'description'
  ) THEN
    ALTER TABLE chapters ADD COLUMN description text;
  END IF;
END $$;

-- Add description field to videos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'description'
  ) THEN
    ALTER TABLE videos ADD COLUMN description text;
  END IF;
END $$;

-- Add course material URL field to courses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'course_material_url'
  ) THEN
    ALTER TABLE courses ADD COLUMN course_material_url text;
  END IF;
END $$;