import { api } from './api.js';

export const listAdminRecipes = (query, signal) => api.get('/admin/recipes', { query, signal });
export const getAdminRecipe = (id, signal) => api.get(`/admin/recipes/${id}`, { signal });
export const createRecipe = (body) => api.post('/admin/recipes', body);
export const updateRecipe = (id, body) => api.patch(`/admin/recipes/${id}`, body);
export const setRecipeStatus = (id, status) => api.patch(`/admin/recipes/${id}/publish`, { status });
export const setRecipeFeatured = (id, isFeatured) => api.patch(`/admin/recipes/${id}/feature`, { isFeatured });
export const deleteRecipe = (id) => api.delete(`/admin/recipes/${id}`);
