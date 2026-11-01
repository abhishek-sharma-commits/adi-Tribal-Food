// Client-side pre-checks. The server re-validates type and size after the upload and is the authority.
export const DEFAULT_LIMITS = {
  imageBytes: 10 * 1024 * 1024,
  videoBytes: 100 * 1024 * 1024,
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
};

export const ACCEPT = [...DEFAULT_LIMITS.allowedTypes.image, ...DEFAULT_LIMITS.allowedTypes.video].join(',');

export function mediaTypeOf(file, limits = DEFAULT_LIMITS) {
  if (limits.allowedTypes.image.includes(file.type)) return 'image';
  if (limits.allowedTypes.video.includes(file.type)) return 'video';
  return null;
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** Returns an error message, or '' when the file is acceptable. */
export function validateFile(file, limits = DEFAULT_LIMITS) {
  const type = mediaTypeOf(file, limits);
  if (!type) return 'Unsupported file type. Use a JPG, PNG, WebP, GIF or AVIF photo, or an MP4, WebM or MOV video.';
  if (file.size === 0) return 'This file is empty.';
  const max = type === 'image' ? limits.imageBytes : limits.videoBytes;
  if (file.size > max) return `This ${type} is ${formatBytes(file.size)}. The limit is ${formatBytes(max)}.`;
  return '';
}

/** ImageKit serves a still frame of a video at <video-url>/ik-thumbnail.jpg. */
export function videoThumbnailUrl(url) {
  const u = new URL(url);
  u.pathname = `${u.pathname.replace(/\/$/, '')}/ik-thumbnail.jpg`;
  return u.toString();
}
