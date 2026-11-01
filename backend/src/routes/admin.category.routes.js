import { Router } from 'express';
import { create, list, remove, update } from '../controllers/admin.category.controller.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validators.js';

const router = Router();

router.get('/', list);
router.post('/', validate(createCategorySchema), create);
router.patch('/:id', validateObjectId(), validate(updateCategorySchema), update);
router.delete('/:id', validateObjectId(), remove);

export default router;
