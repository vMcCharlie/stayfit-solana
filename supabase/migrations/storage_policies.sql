-- Storage policies for bucket management and file handling
-- This migration will enable proper security policies for the avatars bucket

-- First, enable buckets policy for authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets" ON storage.buckets
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Policy for bucket viewing by all users
CREATE POLICY "Buckets are viewable by everyone" ON storage.buckets
    FOR SELECT USING (true);

-- Policy for bucket updating by authenticated users
CREATE POLICY "Allow authenticated users to update buckets" ON storage.buckets
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create avatars bucket if it doesn't exist yet
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- File access policies for the avatars bucket
CREATE POLICY "Avatar files are accessible by everyone" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar files
CREATE POLICY "Users can upload their own avatar files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own avatar files
CREATE POLICY "Users can update their own avatar files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');

-- Allow users to delete their own avatar files
CREATE POLICY "Users can delete their own avatar files" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'avatars'); 