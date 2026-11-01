import { Router } from 'express';
import { create, get, list, remove, update } from '../controllers/admin.blog.controller.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { adminBlogListQuery, createBlogSchema, updateBlogSchema } from '../validators/blog.validators.js';

const router = Router();

router.get('/', validate(adminBlogListQuery, 'query'), list);
router.post('/', validate(createBlogSchema), create);
router.get('/:id', validateObjectId(), get);
router.patch('/:id', validateObjectId(), validate(updateBlogSchema), update);
router.delete('/:id', validateObjectId(), remove);

export default router;
