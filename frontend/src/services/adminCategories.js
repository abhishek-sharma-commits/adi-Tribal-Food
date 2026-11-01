import { api } from './api.js';

export const listAdminCategories = (signal) => api.get('/admin/categories', { signal });
export const createCategory = (body) => api.post('/admin/categories', body);
export const updateCategory = (id, body) => api.patch(`/admin/categories/${id}`, body);
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);
