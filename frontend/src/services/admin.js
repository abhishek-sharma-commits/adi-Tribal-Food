import { api } from './api.js';

export const getDashboard = (signal) => api.get('/admin/dashboard', { signal });

export const listAdminSubmissions = (query, signal) => api.get('/admin/submissions', { query, signal });
export const reviewSubmission = (id, body) => api.patch(`/admin/submissions/${id}/review`, body);
export const deleteAdminSubmission = (id) => api.delete(`/admin/submissions/${id}`);

export const listUsers = (query, signal) => api.get('/admin/users', { query, signal });
export const getUser = (id, signal) => api.get(`/admin/users/${id}`, { signal });
export const setUserStatus = (id, accountStatus) => api.patch(`/admin/users/${id}/status`, { accountStatus });
