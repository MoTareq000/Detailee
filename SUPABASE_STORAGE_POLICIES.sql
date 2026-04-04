-- Run this in the Supabase SQL editor for the current project.
-- It allows only mohamad23012778@gmail.com to upload/delete product images
-- while keeping reads open for storefront usage.

drop policy if exists "product images are publicly readable" on public.product_images;
drop policy if exists "admin can insert product images" on public.product_images;
drop policy if exists "admin can delete product images" on public.product_images;

create policy "product images are publicly readable"
on public.product_images
for select
using (true);

create policy "admin can insert product images"
on public.product_images
for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'mohamad23012778@gmail.com');

create policy "admin can delete product images"
on public.product_images
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'mohamad23012778@gmail.com');

drop policy if exists "product pics are publicly readable" on storage.objects;
drop policy if exists "admin can upload product pics" on storage.objects;
drop policy if exists "admin can update product pics" on storage.objects;
drop policy if exists "admin can delete product pics" on storage.objects;

create policy "product pics are publicly readable"
on storage.objects
for select
using (bucket_id = 'product_pics');

create policy "admin can upload product pics"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'product_pics'
    and (auth.jwt() ->> 'email') = 'mohamad23012778@gmail.com'
);

create policy "admin can update product pics"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'product_pics'
    and (auth.jwt() ->> 'email') = 'mohamad23012778@gmail.com'
)
with check (
    bucket_id = 'product_pics'
    and (auth.jwt() ->> 'email') = 'mohamad23012778@gmail.com'
);

create policy "admin can delete product pics"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'product_pics'
    and (auth.jwt() ->> 'email') = 'mohamad23012778@gmail.com'
);
