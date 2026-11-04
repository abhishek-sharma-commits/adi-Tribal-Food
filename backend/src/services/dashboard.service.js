import { Recipe, User } from '../models/index.js';

export async function getDashboardStats() {
  const [totalUsers, publishedRecipes] = await Promise.all([
    User.countDocuments({}),
    Recipe.countDocuments({ status: 'published' }),
  ]);
  return { totalUsers, publishedRecipes };
}
