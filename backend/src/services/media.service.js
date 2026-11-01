import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const API_BASE = 'https://api.imagekit.io/v1';
const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const SIGNATURE_TTL_SECONDS = 30 * 60; // ImageKit requires < 1 hour
const REQUEST_TIMEOUT_MS = 8000;

export const ALLOWED_MIME = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

export const OFFICIAL_FOLDER = '/adi-food/official';
export const communityFolder = (userId) => `/adi-food/community/${userId}`;

function requireConfigured() {
  if (!env.imagekit.configured) throw new ApiError(503, 'Media uploads are not configured', 'MEDIA_NOT_CONFIGURED');
}

const authHeader = () => `Basic ${Buffer.from(`${env.imagekit.privateKey}:`).toString('base64')}`;
const unavailable = () => new ApiError(502, 'Could not verify the uploaded file. Please try again.', 'MEDIA_VERIFY_UNAVAILABLE');

/** Parameters the browser needs to upload straight to ImageKit. The private key never leaves the server. */
export function createUploadAuth({ purpose, user }) {
  requireConfigured();
  if (purpose === 'official' && user.role !== 'admin') throw ApiError.forbidden();

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + SIGNATURE_TTL_SECONDS;
  const signature = crypto.createHmac('sha1', env.imagekit.privateKey).update(token + expire).digest('hex');

  return {
    uploadUrl: UPLOAD_URL,
    publicKey: env.imagekit.publicKey,
    urlEndpoint: env.imagekit.urlEndpoint,
    token,
    expire,
    signature,
    folder: purpose === 'official' ? OFFICIAL_FOLDER : communityFolder(user._id),
    limits: {
      imageBytes: env.mediaLimits.imageBytes,
      videoBytes: env.mediaLimits.videoBytes,
      allowedTypes: ALLOWED_MIME,
    },
  };
}

/** Best-effort removal of provider files. Never throws: a cleanup failure must not fail the request. */
export async function deleteFiles(fileIds) {
  const ids = [...new Set((fileIds ?? []).filter(Boolean))];
  if (!ids.length || !env.imagekit.configured) return;
  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${API_BASE}/files/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { Authorization: authHeader() },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!res.ok && res.status !== 404) console.warn(`ImageKit delete ${id} failed: HTTP ${res.status}`);
      } catch (err) {
        console.warn(`ImageKit delete ${id} failed: ${err.message}`);
      }
    })
  );
}

const sameFile = (a, b) => {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.origin === ub.origin && ua.pathname === ub.pathname; // ImageKit appends ?updatedAt=...
  } catch {
    return false;
  }
};

/**
 * Asks ImageKit about an uploaded file and enforces ownership, type and size server-side
 * (the browser upload itself cannot be trusted to respect them).
 */
export async function verifyUploadedFile({ fileId, url, mediaType, folder }) {
  requireConfigured();

  let res;
  try {
    res = await fetch(`${API_BASE}/files/${encodeURIComponent(fileId)}/details`, {
      headers: { Authorization: authHeader() },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw unavailable();
  }
  if (res.status === 404 || res.status === 400) throw ApiError.badRequest('Uploaded file not found', 'MEDIA_NOT_FOUND');
  if (!res.ok) throw unavailable();

  const file = await res.json();
  if (file.fileId !== fileId || typeof file.filePath !== 'string' || !file.filePath.startsWith(`${folder}/`)) {
    // Not the caller's file, so it is never deleted here.
    throw ApiError.badRequest('Uploaded file is not in your upload folder', 'MEDIA_FOLDER_MISMATCH');
  }
  if (!sameFile(file.url, url)) throw ApiError.badRequest('Media URL does not match the uploaded file', 'MEDIA_URL_MISMATCH');

  // From here on the file belongs to the caller, so invalid uploads are removed from the provider.
  const reject = async (message, code) => {
    await deleteFiles([fileId]);
    throw ApiError.badRequest(message, code);
  };
  if (!ALLOWED_MIME[mediaType]?.includes(file.mime)) {
    await reject(`File type is not allowed for ${mediaType} uploads`, 'MEDIA_TYPE_NOT_ALLOWED');
  }
  const maxBytes = mediaType === 'image' ? env.mediaLimits.imageBytes : env.mediaLimits.videoBytes;
  if (!(file.size > 0) || file.size > maxBytes) {
    await reject(`File exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit`, 'MEDIA_TOO_LARGE');
  }
  return { size: file.size, mime: file.mime };
}
