import { Blog, Recipe, User } from '../models/index.js';
import { statusCounts } from './moderation.service.js';

export async function getDashboardStats() {
  const [totalUsers, publishedRecipes, publishedBlogs, submissions] = await Promise.all([
    User.countDocuments({}),
    Recipe.countDocuments({ status: 'published' }),
    Blog.countDocuments({ status: 'published' }),
    statusCounts(),
  ]);
  return { totalUsers, publishedRecipes, publishedBlogs, submissions };
}
