# Supabase Storage Setup for Avatar Upload

## ✅ SETUP COMPLETE

The avatars storage bucket has been automatically configured with:

- **Bucket name**: `avatars`
- **Public access**: ✅ Enabled
- **File size limit**: 5MB (5,242,880 bytes)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- **Created**: 2025-07-22 14:32:23 UTC

## ✅ RLS POLICIES CONFIGURED

The following Row Level Security policies have been automatically applied:

### 1. Authenticated Upload Policy
```sql
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
```

### 2. Authenticated Update Policy
```sql
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
```

### 3. Authenticated Delete Policy
```sql
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
```

### 4. Public Read Policy
```sql
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

## 3. Alternative: Simple Public Access (Less Secure)

If you want simpler setup without user-specific folders:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update any avatar (if needed)
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

## 4. Test Storage Setup

After creating the bucket and policies, test with:

```javascript
// Test upload
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('test-image.jpg', file)

// Test public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('test-image.jpg')
```

## 5. File Naming Convention

The avatar upload component uses this naming pattern:
```
{userId}-{randomNumber}.{fileExtension}
```

Example: `123e4567-e89b-12d3-a456-426614174000-0.8234567890123456.jpg`

This ensures:
- Unique file names
- User identification
- No file conflicts
- Easy cleanup if needed

## 6. Troubleshooting

### Common Issues:

1. **Upload fails**: Check RLS policies are enabled and correct
2. **Images don't display**: Ensure bucket is public or has correct read policies
3. **Permission denied**: Verify user is authenticated and policies match file naming
4. **File size errors**: Check bucket file size limits

### Debug Commands:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Check bucket settings
SELECT * FROM storage.buckets WHERE name = 'avatars';
```
