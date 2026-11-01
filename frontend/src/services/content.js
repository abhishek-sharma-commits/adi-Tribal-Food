import { api } from './api.js';

export const getCategories = (signal) => api.get('/categories', { signal });
export const getRecipe = (slug, signal) => api.get(`/recipes/${encodeURIComponent(slug)}`, { signal });
export const listRecipes = (query, signal) => api.get('/recipes', { query, signal });
export const listOfficialMedia = (query, signal) => api.get('/media', { query, signal });
export const listGallery = (query, signal) => api.get('/community/gallery', { query, signal });
export const getBlog = (slug, signal) => api.get(`/blogs/${encodeURIComponent(slug)}`, { signal });
export const listBlogs = (query, signal) => api.get('/blogs', { query, signal });
