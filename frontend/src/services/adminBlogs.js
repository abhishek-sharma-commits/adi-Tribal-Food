import { api } from './api.js';

export const listAdminBlogs = (query, signal) => api.get('/admin/blogs', { query, signal });
export const getAdminBlog = (id, signal) => api.get(`/admin/blogs/${id}`, { signal });
export const createBlog = (body) => api.post('/admin/blogs', body);
export const updateBlog = (id, body) => api.patch(`/admin/blogs/${id}`, body);
export const deleteBlog = (id) => api.delete(`/admin/blogs/${id}`);
