/**
 * Image Loader Utilities
 * 
 * Utility functions for loading and handling images
 */

import { ImageLoaderProps } from 'next/image';

/**
 * Custom image loader for Next.js Image component
 * 
 * This loader adds a cache-busting parameter to the URL to prevent caching issues
 * with external image providers like Mux.
 * 
 * @param params - Image loader parameters
 * @returns URL with cache-busting parameter
 */
export function customImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Add cache-busting parameter to prevent caching issues
  const cacheBuster = Date.now();
  
  // Add width and quality parameters if provided
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (quality) params.append('quality', quality.toString());
  params.append('cb', cacheBuster.toString());
  
  // Check if the URL already has parameters
  const hasParams = src.includes('?');
  
  // Return the URL with the parameters
  return `${src}${hasParams ? '&' : '?'}${params.toString()}`;
}

/**
 * Check if an image exists
 * 
 * @param url - Image URL
 * @returns Promise that resolves to true if the image exists, false otherwise
 */
export function checkImageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    
    img.src = url;
  });
}

/**
 * Get a fallback image URL
 * 
 * @param width - Image width
 * @param height - Image height
 * @param text - Text to display on the fallback image
 * @returns Fallback image URL
 */
export function getFallbackImageUrl(
  width: number = 640,
  height: number = 360,
  text: string = 'No Image'
): string {
  // Use a placeholder image service
  return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
}
