import { Router } from 'express';
import { getBlog, listBlogs } from '../controllers/blog.controller.js';
import { validate } from '../middleware/validate.js';
import { blogSlugParam, publicBlogListQuery } from '../validators/blog.validators.js';

const router = Router();

router.get('/', validate(publicBlogListQuery, 'query'), listBlogs);
router.get('/:slug', validate(blogSlugParam, 'params'), getBlog);

export default router;
