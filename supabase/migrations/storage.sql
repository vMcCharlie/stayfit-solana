-- Create storage bucket for progress photos
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true);

-- Set up storage policies
create policy "Users can view own progress photos"
  on storage.objects for select
  using ( auth.uid() = (storage.foldername(name))[1]::uuid );

create policy "Users can upload own progress photos"
  on storage.objects for insert
  with check (
    auth.uid() = (storage.foldername(name))[1]::uuid
    and bucket_id = 'progress-photos'
  );

create policy "Users can update own progress photos"
  on storage.objects for update
  using ( auth.uid() = (storage.foldername(name))[1]::uuid );

create policy "Users can delete own progress photos"
  on storage.objects for delete
  using ( auth.uid() = (storage.foldername(name))[1]::uuid ); 