import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import blogRoutes from './blog.routes.js';
import categoryRoutes from './category.routes.js';
import communityRoutes from './community.routes.js';
import mediaRoutes from './media.routes.js';
import recipeRoutes from './recipe.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/recipes', recipeRoutes);
router.use('/community', communityRoutes);
router.use('/blogs', blogRoutes);
router.use('/media', mediaRoutes);
router.use('/admin', adminRoutes);

export default router;
