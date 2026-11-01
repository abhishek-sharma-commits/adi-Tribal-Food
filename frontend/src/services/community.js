import { api } from './api.js';

export class UploadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UploadError';
  }
}

export const getUploadAuth = (purpose = 'community', signal) => api.post('/media/upload-auth', { purpose }, { signal });
export const createSubmission = (payload) => api.post('/community/submissions', payload);

/**
 * Uploads straight from the browser to ImageKit with the server-signed parameters.
 * XHR rather than fetch, because fetch cannot report upload progress.
 */
export function uploadToImageKit({ file, auth, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', auth.uploadUrl);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error body */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.fileId && body?.url) resolve(body);
      else reject(new UploadError(body?.message ? `Upload failed: ${body.message}` : `Upload failed (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new UploadError('Upload failed. Check your connection and try again.'));
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    const form = new FormData();
    form.set('file', file);
    form.set('fileName', file.name);
    form.set('publicKey', auth.publicKey);
    form.set('signature', auth.signature);
    form.set('expire', String(auth.expire));
    form.set('token', auth.token);
    form.set('folder', auth.folder);
    form.set('useUniqueFileName', 'true');
    xhr.send(form);
  });
}

export const listMySubmissions = (query, signal) => api.get('/community/submissions/mine', { query, signal });
export const getMySubmission = (id, signal) => api.get(`/community/submissions/mine/${id}`, { signal });
export const updateMySubmission = (id, data) => api.patch(`/community/submissions/${id}`, data);
export const deleteMySubmission = (id) => api.delete(`/community/submissions/${id}`);
