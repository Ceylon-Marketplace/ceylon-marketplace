# Vercel Blob Storage Integration Guide

## Overview

The Ceylon Marketplace now integrates with Vercel Blob Storage for secure, scalable image uploads. Users can upload up to 10 images per listing with full validation, preview, drag-and-drop support, and deletion functionality.

---

## Features Implemented

### ✅ Core Features
- **File Upload:** Drag-and-drop or click to upload images
- **Multiple Images:** Support for up to 10 images per listing
- **Progress Tracking:** Real-time upload progress with percentage display
- **Image Preview:** Immediate preview of uploaded images
- **Image Deletion:** Remove images before or after saving
- **Error Handling:** Comprehensive validation with user-friendly error messages
- **Security:** Server-side validation and user ownership verification

### ✅ Validation
- File type: JPEG, PNG, WebP, GIF only
- File size: Max 10MB per image
- Image count: Max 10 per listing
- User ownership: Only listing owners can modify images

---

## Files Created/Modified

### New Files
1. **`src/app/api/listings/upload-image/route.ts`**
   - Handles image uploads to Vercel Blob Storage
   - Validates file type and size
   - Generates unique, organized filenames
   - Returns upload confirmation with image URL

2. **`src/app/api/listings/delete-image/route.ts`**
   - Handles image deletion from Vercel Blob Storage
   - Verifies user ownership of listing
   - Removes files from blob storage and database

3. **`src/components/image-uploader.tsx`**
   - Reusable image upload component
   - Drag-and-drop interface
   - Upload progress tracking
   - Error display with retry capability
   - Upload count display

### Modified Files
1. **`src/app/(main)/listings/create/page.tsx`**
   - Replaced URL input with file upload
   - Integrated `ImageUploader` component
   - Added image validation before submission
   - Requires at least 1 image

2. **`src/app/(main)/listings/[id]/edit/page.tsx`**
   - Added ability to upload new images while editing
   - Separated existing images from new uploads
   - Maintains existing image deletion functionality
   - Respects 10-image limit with remaining slots calculation

---

## API Endpoints

### POST /api/listings/upload-image
**Upload a new image to Vercel Blob Storage**

**Request:**
```
Content-Type: multipart/form-data
- file (required): Image file (JPEG, PNG, WebP, GIF)
- listingId (optional): For existing listings, validates count limit
```

**Response (200 OK):**
```json
{
  "url": "https://blob.vercel-storage.com/listings/user-id/timestamp-random.ext",
  "filename": "listings/user-id/timestamp-random.ext"
}
```

**Errors:**
- `400`: No file provided, invalid type, or exceeds size limit
- `403`: Unauthorized (requires auth)
- `500`: Upload failed

### DELETE /api/listings/delete-image
**Delete an image from Vercel Blob Storage**

**Query Parameters:**
- `listingId` (required): The listing ID
- `mediaId` (required): The media record ID to delete

**Response (200 OK):**
```json
{
  "message": "Image deleted successfully"
}
```

**Errors:**
- `400`: Missing required parameters
- `403`: Unauthorized (user doesn't own listing)
- `404`: Media record not found
- `500`: Deletion failed

---

## Component Usage

### ImageUploader Component

**Props:**
```typescript
interface ImageUploaderProps {
  images: UploadedImage[]; // Current uploaded images
  onImagesChange: (images) => void; // Callback when images change
  maxImages?: number; // Max images allowed (default: 10)
  maxFileSize?: number; // Max file size in bytes (default: 10MB)
  listingId?: string; // Optional, for existing listings
}
```

**Example - Create Listing:**
```typescript
import { ImageUploader } from "@/components/image-uploader";
import { useState } from "react";

export function CreateListing() {
  const [uploadedImages, setUploadedImages] = useState([]);

  return (
    <ImageUploader
      images={uploadedImages}
      onImagesChange={setUploadedImages}
      maxImages={10}
    />
  );
}
```

**Example - Edit Listing:**
```typescript
<ImageUploader
  images={newImages}
  onImagesChange={setNewImages}
  maxImages={10 - existingMedia.length}
  listingId={listingId}
/>
```

---

## Data Models

### UploadedImage (Client)
```typescript
interface UploadedImage {
  url: string;              // Blob URL or placeholder
  order: number;            // Display order
  isUploading?: boolean;    // Upload in progress
  uploadProgress?: number;  // 0-100%
  error?: string;          // Error message if failed
}
```

### ListingMedia (Database)
```prisma
model ListingMedia {
  id        String    @id @default(cuid())
  listingId String
  url       String              // Vercel Blob URL
  type      MediaType           // IMAGE or VIDEO
  order     Int                  // Display order
  createdAt DateTime  @default(now())
  listing   Listing   @relation(fields: [listingId], references: [id], onDelete: Cascade)
}

enum MediaType {
  IMAGE
  VIDEO
}
```

---

## Environment Variables

Ensure these environment variables are configured in Vercel:

```env
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>
```

This token is automatically set by Vercel when Blob Storage is enabled.

---

## Security Features

### Server-Side Validation
- ✅ File type whitelist (JPEG, PNG, WebP, GIF)
- ✅ File size limits (10MB max)
- ✅ Image count limits (10 per listing)
- ✅ User ownership verification
- ✅ Authentication required

### URL Security
- ✅ Public read access for images (required for display)
- ✅ Write access restricted via API authentication
- ✅ File path includes user ID for organization
- ✅ Deletion requires ownership verification

### Data Integrity
- ✅ Atomic transactions (DB + Blob)
- ✅ Orphaned file cleanup on failure
- ✅ Listing cascade delete removes all media

---

## Upload Workflow

### Creating a New Listing

```
1. User selects images via upload component
   ↓
2. Client validates file type/size locally
   ↓
3. Files sent to /api/listings/upload-image
   ↓
4. Server validates again + generates filename
   ↓
5. File uploaded to Vercel Blob Storage
   ↓
6. URL returned to client, displayed in preview
   ↓
7. User submits form
   ↓
8. Listing created with media URLs in ListingMedia table
```

### Editing an Existing Listing

```
1. Existing media displayed with delete buttons
   ↓
2. User can add new images via upload component
   ↓
3. New images uploaded and added to state
   ↓
4. User removes images by clicking delete (added to removedMediaIds)
   ↓
5. Form submitted with:
   - mediaToAdd: new images with URLs from Blob
   - mediaToRemove: IDs of images to delete
   ↓
6. Backend updates ListingMedia table
   ↓
7. Deleted images removed from Blob Storage
```

### Deleting Images

**Via Edit Page:**
1. User clicks delete button on image
2. Image removed from ListingMedia table
3. File deleted from Vercel Blob Storage
4. Client UI updates

**Via DELETE API:**
- Called from edit page submit handler
- Updates database and deletes blob file
- Returns success/error

---

## Error Handling

### Client-Side
- File type validation with helpful error messages
- Size validation before upload
- Display error messages below upload area
- Allow retry by re-uploading

### Server-Side
- 400: Invalid file (type, size, format)
- 400: Listing image limit exceeded
- 403: User doesn't own listing
- 404: Media record not found
- 500: Upload/deletion failed

### User Experience
- Real-time upload progress (0-100%)
- Error messages with specific details (e.g., "iPhone.zip: Invalid file type")
- Ability to remove errored images and retry
- Graceful degradation (upload can fail, page continues)

---

## Performance Considerations

### Upload Optimization
- Max file size: 10MB
- Supported formats: JPEG, PNG, WebP, GIF
- Parallel uploads: Sequential (one at a time for reliability)
- Progress tracking: Real-time via XHR progress events

### Storage Organization
- Path structure: `listings/{userId}/{timestamp}-{random}.{ext}`
- Unique filenames prevent collisions
- User ID enables easier organization/audit

### Bandwidth
- Vercel Blob Storage: Global CDN included
- Images served with automatic optimization
- Public read access enables fast retrieval

---

## Testing the Integration

### Manual Testing Steps

1. **Create Listing with Images:**
   - Go to `/listings/create`
   - Drag-and-drop or click to upload images
   - Verify previews appear
   - Upload progress shows 0-100%
   - Fill in listing details
   - Submit for review
   - Verify images appear in listing detail page

2. **Edit Listing:**
   - Go to `/listings/mine`
   - Click edit on a listing
   - View existing images
   - Add new images
   - Delete some images
   - Save changes
   - Verify database updated correctly

3. **Validation:**
   - Try uploading non-image file → should reject
   - Try uploading file > 10MB → should reject
   - Try uploading 11 images → 10th should succeed, 11th rejected
   - Try deleting image from another user's listing → should fail (403)

4. **Edge Cases:**
   - Network interruption during upload → handles gracefully
   - Multiple rapid uploads → queued properly
   - Delete image while uploading → no conflict

---

## Troubleshooting

### Images not uploading
- Check `BLOB_READ_WRITE_TOKEN` is set in Vercel
- Verify blob storage is enabled in Vercel project
- Check browser console for errors
- Verify file format is supported

### Images not persisting after save
- Check database ListingMedia records created
- Verify Blob Storage URLs in database
- Check user authentication on API

### Image deletion fails
- Verify user ownership of listing
- Check BLOB_READ_WRITE_TOKEN has delete permission
- Verify media record exists in database

---

## Future Enhancements

- [ ] Image reordering (drag to reorder)
- [ ] Crop/resize before upload
- [ ] Video support (currently IMAGE only)
- [ ] Batch download of images
- [ ] Image compression on server
- [ ] Thumbnail generation
- [ ] Watermarking
- [ ] OCR/moderation integration

---

## References

- [Vercel Blob Storage Docs](https://vercel.com/docs/storage/vercel-blob)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Docs](https://www.prisma.io/docs/)
- [React Upload Patterns](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
