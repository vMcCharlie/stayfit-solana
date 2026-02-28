# Supabase Migrations

This directory contains migration scripts to set up and maintain your Supabase database structure and policies.

## Storage Policies Migration

The `storage_policies.sql` file contains SQL commands to set up proper row-level security (RLS) policies for the storage buckets and objects, specifically for handling profile photos in the "avatars" bucket.

### What it does:

1. Creates policies to allow authenticated users to create, view, and manage storage buckets
2. Creates the "avatars" bucket if it doesn't exist
3. Sets up policies for avatar files to be accessible by everyone for viewing
4. Allows authenticated users to upload, update, and delete their own avatar files

## How to Apply Migrations

### Option 1: Using the Provided Script

1. Make sure you have a `.env` file in the project root with the following variables:

   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

   Note: The SUPABASE_SERVICE_KEY should be your service_role key, not the anon key!

2. Run the migration script:
   ```bash
   node scripts/apply-storage-policies.js
   ```

### Option 2: Manual Application via Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to the SQL editor
3. Copy the contents of `storage_policies.sql`
4. Paste into the SQL editor and run

### Option 3: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

## Troubleshooting

If you encounter the error `[StorageApiError: new row violates row-level security policy]` when trying to create the avatars bucket, it means you need to apply this migration to set up the proper security policies.
