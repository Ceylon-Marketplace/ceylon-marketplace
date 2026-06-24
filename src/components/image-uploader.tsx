"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";

interface UploadedImage {
  url: string;
  order: number;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (
    images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[]),
  ) => void;
  maxImages?: number;
  maxFileSize?: number;
  listingId?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  maxFileSize = 10 * 1024 * 1024,
  listingId,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const remainingSlots =
        maxImages - images.filter((img) => !img.error).length;

      if (remainingSlots === 0) {
        alert(`Maximum ${maxImages} images allowed.`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToUpload) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          onImagesChange([
            ...images,
            {
              url: "",
              order: images.length,
              error: `${file.name}: Invalid file type`,
            },
          ]);
          continue;
        }

        // Validate file size
        if (file.size > maxFileSize) {
          onImagesChange([
            ...images,
            {
              url: "",
              order: images.length,
              error: `${file.name}: File too large (max 10MB)`,
            },
          ]);
          continue;
        }

        // Add uploading placeholder
        const placeholderId = `${Date.now()}-${Math.random()}`;
        const newImages = [
          ...images,
          {
            url: placeholderId,
            order: images.length,
            isUploading: true,
            uploadProgress: 0,
          },
        ];
        onImagesChange(newImages);
        setUploadingCount((c) => c + 1);

        // Upload file
        try {
          const formData = new FormData();
          formData.append("file", file);
          if (listingId) {
            formData.append("listingId", listingId);
          }

          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onImagesChange((prevImages) =>
                prevImages.map((img) =>
                  img.url === placeholderId
                    ? { ...img, uploadProgress: progress }
                    : img,
                ),
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
              const result = JSON.parse(xhr.responseText);
              onImagesChange((prevImages) =>
                prevImages.map((img) =>
                  img.url === placeholderId
                    ? {
                        url: result.url,
                        order: prevImages.filter(
                          (i) => !i.error && i.url !== placeholderId,
                        ).length,
                        isUploading: false,
                      }
                    : img,
                ),
              );
            } else {
              const error = JSON.parse(xhr.responseText);
              onImagesChange((prevImages) =>
                prevImages.map((img) =>
                  img.url === placeholderId
                    ? {
                        url: "",
                        order: prevImages.length - 1,
                        error: error.message || "Upload failed",
                      }
                    : img,
                ),
              );
            }
            setUploadingCount((c) => c - 1);
          });

          xhr.addEventListener("error", () => {
            onImagesChange((prevImages) =>
              prevImages.map((img) =>
                img.url === placeholderId
                  ? {
                      url: "",
                      order: prevImages.length - 1,
                      error: "Upload failed",
                    }
                  : img,
              ),
            );
            setUploadingCount((c) => c - 1);
          });

          xhr.open("POST", "/api/listings/upload-image");
          const token = localStorage.getItem("accessToken");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
          xhr.send(formData);
        } catch (error) {
          console.error("Upload error:", error);
          setUploadingCount((c) => c - 1);
        }
      }
    },
    [images, maxImages, maxFileSize, onImagesChange],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(
      images
        .filter((_, i) => i !== index)
        .map((img, idx) => ({ ...img, order: idx })),
    );
  };

  const validImages = images.filter((img) => !img.error && img.url);
  const errorImages = images.filter((img) => img.error);

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {validImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {validImages.map((image, i) => (
            <div
              key={`${image.url}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
            >
              {image.isUploading ? (
                <div className="flex h-full items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
                    <p className="mt-1 text-xs text-gray-400">
                      {image.uploadProgress}%
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Image
                    src={image.url}
                    alt={`Image ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                      Cover
                    </span>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                disabled={image.isUploading}
                className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80 disabled:opacity-50 group-hover:flex"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {errorImages.length > 0 && (
        <div className="space-y-2">
          {errorImages.map((image, i) => (
            <div
              key={`error-${i}`}
              className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{image.error}</span>
              <button
                type="button"
                onClick={() => removeImage(images.indexOf(image))}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-brand-500 bg-brand-50"
            : "border-gray-300 bg-gray-50"
        } ${validImages.length >= maxImages ? "opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={validImages.length >= maxImages}
        />
        <div className="flex flex-col items-center">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700">
            Drag images here or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPEG, PNG, WebP or GIF • Up to 10MB each
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={validImages.length >= maxImages}
          className="absolute inset-0 rounded-lg"
        />
      </div>

      {/* Image Counter */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {validImages.length}/{maxImages} images uploaded
        </span>
        {uploadingCount > 0 && (
          <span className="flex items-center gap-1 text-brand-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading {uploadingCount}...
          </span>
        )}
      </div>
    </div>
  );
}
