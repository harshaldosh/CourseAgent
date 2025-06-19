/*
  # Create Storage Buckets for Course Management

  1. Storage Buckets
    - `course-images` - For storing course thumbnail images
    - `course-materials` - For storing course materials (PDFs, documents, etc.)
    - `course-videos` - For storing course video files

  2. Security
    - Enable public access for all buckets to allow file retrieval
    - Set up policies for authenticated users to upload files
    - Allow public read access for course content
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('course-images', 'course-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('course-materials', 'course-materials', true, 52428800, ARRAY['application/pdf', 'application/zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']),
  ('course-videos', 'course-videos', true, 524288000, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for course-images bucket
CREATE POLICY "Allow public read access on course images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'course-images');

CREATE POLICY "Allow authenticated users to upload course images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Allow authenticated users to update course images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-images');

CREATE POLICY "Allow authenticated users to delete course images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-images');

-- Create policies for course-materials bucket
CREATE POLICY "Allow public read access on course materials"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'course-materials');

CREATE POLICY "Allow authenticated users to upload course materials"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Allow authenticated users to update course materials"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-materials');

CREATE POLICY "Allow authenticated users to delete course materials"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-materials');

-- Create policies for course-videos bucket
CREATE POLICY "Allow public read access on course videos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'course-videos');

CREATE POLICY "Allow authenticated users to upload course videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-videos');

CREATE POLICY "Allow authenticated users to update course videos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-videos');

CREATE POLICY "Allow authenticated users to delete course videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-videos');