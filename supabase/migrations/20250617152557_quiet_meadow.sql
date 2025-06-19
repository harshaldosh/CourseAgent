/*
  # Fix quiz creation permissions

  1. Security Changes
    - Grant SELECT permission on auth.users table to authenticated role
    - This allows foreign key constraint validation when creating quizzes
    
  This resolves the "permission denied for table users" error that occurs
  when creating quizzes due to the foreign key relationship between
  quizzes -> profiles -> users tables.
*/

-- Grant SELECT permission on auth.users to authenticated role
-- This is needed for foreign key constraint validation
GRANT SELECT ON auth.users TO authenticated;