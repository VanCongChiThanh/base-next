"use client";

import { useState, useCallback } from "react";
import { uploadService } from "@/services";

interface UseUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UseUploadReturn {
  upload: (file: File) => Promise<string | null>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    allowedTypes,
    onSuccess,
    onError,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      reset();

      // Validate file size
      if (file.size > maxSize) {
        const errorMsg = `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
        setError(errorMsg);
        onError?.(new Error(errorMsg));
        return null;
      }

      // Validate file type
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        const errorMsg = `File type ${file.type} is not allowed`;
        setError(errorMsg);
        onError?.(new Error(errorMsg));
        return null;
      }

      setIsUploading(true);
      setProgress(10);

      try {
        setProgress(30);
        const fileUrl = await uploadService.uploadFile(file);
        setProgress(100);
        onSuccess?.(fileUrl);
        return fileUrl;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        onError?.(new Error(errorMsg));
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [maxSize, allowedTypes, onSuccess, onError, reset],
  );

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
  };
}

export default useUpload;
