import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getDashboard } from '../controllers/admin.dashboard.controller.js';
import adminCategoryRoutes from './admin.category.routes.js';
import adminMediaRoutes from './admin.media.routes.js';
import adminRecipeRoutes from './admin.recipe.routes.js';
import adminUserRoutes from './admin.user.routes.js';

const router = Router();

// Single choke point: nothing mounted below is reachable without an active admin session.
router.use(requireAdmin);
router.use('/recipes', adminRecipeRoutes);
// Stories and community moderation remain in source but are not mounted until launch.
// router.use('/blogs', adminBlogRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/media', adminMediaRoutes);
// router.use('/submissions', adminSubmissionRoutes);
router.use('/users', adminUserRoutes);
router.get('/dashboard', getDashboard);

export default router;
