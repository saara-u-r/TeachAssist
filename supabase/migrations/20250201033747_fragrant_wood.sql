/*
  # Add completed field to calendar events and file storage support

  1. Changes
    - Add completed field to calendar_events table
    - Add file_type field to resources table
    - Add file_size field to resources table
  
  2. Storage
    - Create resources bucket for file storage
*/

-- Add completed field to calendar_events
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Add file_type and file_size to resources
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name)
VALUES ('resources', 'resources')
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);