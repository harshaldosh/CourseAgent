/*
  # Setup Storage Buckets and RLS Policies

  1. Storage Buckets
    - Create `course-images` bucket for course image uploads
    - Create `course-materials` bucket for course material uploads  
    - Create `course-videos` bucket for video file uploads

  2. Security Policies
    - Allow anonymous users to insert files into all buckets
    - Allow anonymous users to select/read files from all buckets
    - Allow anonymous users to update files in all buckets
    - Allow anonymous users to delete files from all buckets

  Note: These policies allow anonymous access for simplicity. In production,
  consider implementing authentication and restricting access to authenticated users.
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('course-images', 'course-images', true),
  ('course-materials', 'course-materials', true),
  ('course-videos', 'course-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for course-images bucket
CREATE POLICY "Allow anonymous insert on course-images"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Allow anonymous select on course-images"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'course-images');

CREATE POLICY "Allow anonymous update on course-images"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'course-images')
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Allow anonymous delete on course-images"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'course-images');

-- Create RLS policies for course-materials bucket
CREATE POLICY "Allow anonymous insert on course-materials"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Allow anonymous select on course-materials"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'course-materials');

CREATE POLICY "Allow anonymous update on course-materials"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'course-materials')
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Allow anonymous delete on course-materials"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'course-materials');

-- Create RLS policies for course-videos bucket
CREATE POLICY "Allow anonymous insert on course-videos"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'course-videos');

CREATE POLICY "Allow anonymous select on course-videos"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'course-videos');

CREATE POLICY "Allow anonymous update on course-videos"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'course-videos')
  WITH CHECK (bucket_id = 'course-videos');

CREATE POLICY "Allow anonymous delete on course-videos"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'course-videos');

-- Also allow authenticated users (for future use)
CREATE POLICY "Allow authenticated insert on course-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Allow authenticated select on course-images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-images');

CREATE POLICY "Allow authenticated update on course-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-images')
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Allow authenticated delete on course-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-images');

CREATE POLICY "Allow authenticated insert on course-materials"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Allow authenticated select on course-materials"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-materials');

CREATE POLICY "Allow authenticated update on course-materials"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-materials')
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Allow authenticated delete on course-materials"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-materials');

CREATE POLICY "Allow authenticated insert on course-videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-videos');

CREATE POLICY "Allow authenticated select on course-videos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-videos');

CREATE POLICY "Allow authenticated update on course-videos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-videos')
  WITH CHECK (bucket_id = 'course-videos');

CREATE POLICY "Allow authenticated delete on course-videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-videos');