import { api } from './api.js';

export const listAdminMedia = (query, signal) => api.get('/admin/media', { query, signal });
export const createMedia = (body) => api.post('/admin/media', body);
export const updateMedia = (id, body) => api.patch(`/admin/media/${id}`, body);
export const setMediaStatus = (id, status) => api.patch(`/admin/media/${id}/publish`, { status });
export const setMediaFeatured = (id, isFeatured) => api.patch(`/admin/media/${id}/feature`, { isFeatured });
export const deleteMedia = (id) => api.delete(`/admin/media/${id}`);
