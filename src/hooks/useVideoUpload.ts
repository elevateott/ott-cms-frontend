/**
 * useVideoUpload Hook
 * 
 * A custom hook for handling video uploads to Mux
 */

import { useState, useCallback, useRef } from 'react';
import { eventBus, EVENTS } from '@/utilities/eventBus';
import { API_ENDPOINTS } from '@/constants';
import { UseVideoUploadOptions, UseVideoUploadResult } from '@/types/hooks';

export function useVideoUpload(options: UseVideoUploadOptions = {}): UseVideoUploadResult {
  const { onSuccess, onError, onProgress } = options;
  
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
  
  // Use a ref to store the abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  
  /**
   * Get a direct upload URL from the server
   */
  const getUploadUrl = useCallback(async (file?: File): Promise<string | null> => {
    try {
      if (!file) {
        throw new Error('No file provided');
      }
      
      setIsUploading(true);
      setUploadStatus('uploading');
      setError(null);
      setProgress(0);
      
      // Get the filename from the file
      const filename = file.name;
      
      // Create a direct upload URL
      const res = await fetch(API_ENDPOINTS.MUX_DIRECT_UPLOAD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(`Failed to create upload URL: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!data.data?.url || !data.data?.uploadId) {
        throw new Error('Invalid response from server');
      }
      
      // Create a video document
      try {
        const createRes = await fetch(API_ENDPOINTS.MUX_CREATE_VIDEO, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uploadId: data.data.uploadId,
            filename,
          }),
          credentials: 'include',
        });
        
        if (!createRes.ok) {
          console.warn('Failed to create video document, but upload URL was created');
        }
      } catch (createError) {
        console.error('Error creating video document:', createError);
      }
      
      // Emit an event that upload has started
      eventBus.emit(EVENTS.VIDEO_UPLOAD_STARTED, {
        uploadId: data.data.uploadId,
        filename,
      });
      
      return data.data.url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setUploadStatus('error');
      if (onError) {
        onError(error);
      }
      return null;
    }
  }, [onError]);
  
  /**
   * Upload a file to the provided URL
   */
  const uploadFile = useCallback(async (file: File, url: string): Promise<boolean> => {
    try {
      // Create a new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      // Upload the file
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progressValue = (event.loaded / event.total) * 100;
          setProgress(progressValue);
          
          // Call the onProgress callback if provided
          if (onProgress) {
            onProgress(progressValue);
          }
          
          // Emit a progress event
          eventBus.emit(EVENTS.VIDEO_UPLOAD_PROGRESS, {
            progress: progressValue,
            loaded: event.loaded,
            total: event.total,
          });
        }
      };
      
      // Create a promise to handle the XHR request
      const uploadPromise = new Promise<boolean>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
        
        xhr.onabort = () => {
          reject(new Error('Upload aborted'));
        };
      });
      
      // Start the upload
      xhr.open('PUT', url, true);
      xhr.send(file);
      
      // Handle abort signal
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
      
      // Wait for the upload to complete
      const result = await uploadPromise;
      
      // Update state
      setProgress(100);
      setUploadStatus('processing');
      
      // Emit an event that upload has completed
      eventBus.emit(EVENTS.VIDEO_UPLOAD_COMPLETED, {
        filename: file.name,
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess({
          filename: file.name,
          size: file.size,
          type: file.type,
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setUploadStatus('error');
      
      // Emit an error event
      eventBus.emit(EVENTS.VIDEO_UPLOAD_ERROR, {
        error: error.message,
      });
      
      if (onError) {
        onError(error);
      }
      
      return false;
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [onProgress, onSuccess, onError]);
  
  /**
   * Upload a file to Mux
   */
  const upload = useCallback(async (file: File): Promise<boolean> => {
    try {
      // Get the upload URL
      const url = await getUploadUrl(file);
      
      if (!url) {
        throw new Error('Failed to get upload URL');
      }
      
      // Upload the file
      return await uploadFile(file, url);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setUploadStatus('error');
      
      // Emit an error event
      eventBus.emit(EVENTS.VIDEO_UPLOAD_ERROR, {
        error: error.message,
      });
      
      if (onError) {
        onError(error);
      }
      
      return false;
    }
  }, [getUploadUrl, uploadFile, onError]);
  
  /**
   * Cancel the current upload
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      
      setIsUploading(false);
      setUploadStatus('idle');
      setProgress(0);
      
      return true;
    }
    
    return false;
  }, []);
  
  /**
   * Reset the upload state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadStatus('idle');
  }, []);
  
  return {
    isUploading,
    progress,
    error,
    uploadStatus,
    upload,
    cancelUpload,
    reset,
  };
}
