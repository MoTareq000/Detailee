/*
  RUN THIS IN YOUR SUPABASE SQL EDITOR
  This script ensures all users with the 'admin' role in your profiles table 
  have full permissions to upload and manage product images in the storage bucket.
*/

-- 1. Ensure the bucket exists (just in case)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product_pics', 'product_pics', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Admins to upload (INSERT)
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product_pics' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Allow Admins to manage (UPDATE/DELETE)
CREATE POLICY "Admins can manage product images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'product_pics' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Ensure public.product_images table also has correct policies
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
CREATE POLICY "Public read product_images" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage product_images" ON public.product_images;
CREATE POLICY "Admin manage product_images" ON public.product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
