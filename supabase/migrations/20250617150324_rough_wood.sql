/*
  # Fix quiz creation permissions

  1. Changes
    - Update quizzes table to reference profiles instead of auth.users
    - This resolves the permission denied error when creating quizzes
    - The profiles table already has proper RLS policies configured

  2. Security
    - Maintains existing RLS policies on quizzes table
    - Uses profiles table which has proper authentication policies
*/

-- Drop the existing foreign key constraint
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_created_by_fkey;

-- Add new foreign key constraint to profiles table
ALTER TABLE quizzes ADD CONSTRAINT quizzes_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;