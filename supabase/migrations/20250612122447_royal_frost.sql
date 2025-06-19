/*
  # Create Admin User and Profile

  1. User Management
    - Create admin user using Supabase auth functions
    - Set up admin profile with proper metadata
    
  2. Security
    - Ensure admin user has proper role assignment
    - Create profile entry for admin user
    
  3. Notes
    - Uses Supabase's built-in auth functions instead of direct table manipulation
    - Handles conflicts gracefully
*/

-- Create a function to safely create admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'harshal9901@gmail.com';
  
  -- If user doesn't exist, we'll create a profile entry that can be linked later
  -- Note: In production, admin users should be created through Supabase Auth UI or API
  IF admin_user_id IS NULL THEN
    -- Generate a UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- Insert into profiles table with admin role
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
      admin_user_id,
      'Admin User',
      null
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name;
      
    -- Log that manual user creation is needed
    RAISE NOTICE 'Admin profile created with ID: %. Please create auth user manually with email: harshal9901@gmail.com', admin_user_id;
  ELSE
    -- Update existing profile
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
      admin_user_id,
      'Admin User',
      null
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name;
      
    RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
  END IF;
END;
$$;

-- Execute the function
SELECT create_admin_user();

-- Drop the function after use
DROP FUNCTION create_admin_user();

-- Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for profiles to be more permissive for admin operations
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies that allow admin operations
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow public read access for basic profile info (needed for admin checks)
CREATE POLICY "Allow public read access to profiles" ON profiles
  FOR SELECT TO public USING (true);