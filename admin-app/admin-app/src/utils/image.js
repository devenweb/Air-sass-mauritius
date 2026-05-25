/**
 * Centralized utility for resolving image URLs across the Admin application.
 * Handles Supabase storage paths, bundled src/assets, and external URLs.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'bucket';
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}`;

// Eagerly import all assets in src/assets/ to get their bundled URLs
// This allows resolveImageUrl('/assets/...') to work even if the public/ folder is empty
const assetMap = import.meta.glob('../assets/**/*', { eager: true, as: 'url' });

export const resolveImageUrl = (path, fallback = "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image") => {
  if (!path) return fallback;

  // 1. If it's already a full URL (http:// or https://), return it
  if (path.startsWith('http')) {
    return path;
  }

  // 2. Handle bundled assets in src/assets
  // If path is "/assets/categories/hotels.png", we look for "../assets/categories/hotels.png" in the map
  if (path.startsWith('/assets/')) {
    // Note: The glob imports are relative to this file's directory (src/utils/)
    // so they are indexed as "../assets/..."
    const assetPath = `..${path}`; 
    if (assetMap[assetPath]) {
      return assetMap[assetPath];
    }
    // Fallback if not found in src/assets, maybe it's in public/
    return path;
  }

  // 3. Handle Supabase storage paths (e.g., "services/image.png")
  if (path.includes('/') && !path.startsWith('/')) {
    // If it already starts with the bucket name, just return the full public URL
    if (path.startsWith(`${STORAGE_BUCKET}/`)) {
       return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
    }
    // Otherwise, append the bucket name
    return `${STORAGE_URL}/${path}`;
  }

  // 4. Default fallback
  return path || fallback;
};

/**
 * Optimizes an image for web upload.
 * Resizes the image to a maximum dimension and compresses it to reduce file size.
 * Iteratively reduces quality if the file size remains above the threshold.
 * 
 * @param {File} file - The original image file
 * @param {Object} options - Optimization options
 * @returns {Promise<File>} - The optimized image file
 */
export const optimizeImage = (file, { maxWidth = 1600, maxHeight = 1600, quality = 0.8, maxFileSize = 1.2 * 1024 * 1024 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const attemptCompression = (currentQuality) => {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // If the blob is still too large and we can still reduce quality
                if (blob.size > maxFileSize && currentQuality > 0.2) {
                  attemptCompression(currentQuality - 0.1);
                } else {
                  const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(optimizedFile);
                }
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        attemptCompression(quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
