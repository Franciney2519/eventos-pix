-- ============================================================================
-- Private storage bucket for payment proofs
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Files are stored under "<user_id>/<order_id>/<filename>" so ownership can
-- be checked purely from the storage path, without a join.

create policy "payment_proofs_owner_upload"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "payment_proofs_owner_read"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or current_user_role() = 'ADMIN'
  )
);

-- Event cover images: public bucket, admin-only writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "event_images_public_read"
on storage.objects for select
using (bucket_id = 'event-images');

create policy "event_images_admin_write"
on storage.objects for insert
with check (bucket_id = 'event-images' and current_user_role() = 'ADMIN');

create policy "event_images_admin_update"
on storage.objects for update
using (bucket_id = 'event-images' and current_user_role() = 'ADMIN');

create policy "event_images_admin_delete"
on storage.objects for delete
using (bucket_id = 'event-images' and current_user_role() = 'ADMIN');
