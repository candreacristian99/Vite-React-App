import { supabase } from './supabase.js';

export function getMediaValue(record, fields = ['image_url', 'image_urls', 'images', 'photo_url']) {
  for (const field of fields) {
    const value = record?.[field];
    if (!value) continue;

    if (Array.isArray(value)) {
      const first = value.find(Boolean);
      if (first) return first;
    } else if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed[0]) return parsed[0];
      } catch {
        // Plain storage paths and URLs are both valid string values.
      }
      return value;
    }
  }
  return '';
}

export function resolveStorageUrl(value, bucket) {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return supabase.storage.from(bucket).getPublicUrl(value).data.publicUrl;
}

export function getRecordImageUrl(record, bucket = 'listings') {
  return resolveStorageUrl(getMediaValue(record), bucket);
}

export function compressImage(file, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const scale = image.width > maxWidth ? maxWidth / image.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('The image could not be prepared for upload.'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.84,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The selected file is not a valid image.'));
    };
    image.src = objectUrl;
  });
}

export async function uploadImage(file, bucket, path) {
  const blob = await compressImage(file);
  const { data, error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: '3600',
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) throw error;
  return {
    path: data.path,
    url: supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl,
  };
}