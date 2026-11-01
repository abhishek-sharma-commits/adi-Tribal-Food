import { Router } from 'express';
import { create, feature, get, list, publish, remove, update } from '../controllers/admin.recipe.controller.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import {
  adminRecipeListQuery,
  createRecipeSchema,
  featureRecipeSchema,
  publishRecipeSchema,
  updateRecipeSchema,
} from '../validators/recipe.validators.js';

const router = Router();

router.get('/', validate(adminRecipeListQuery, 'query'), list);
router.post('/', validate(createRecipeSchema), create);
router.get('/:id', validateObjectId(), get);
router.patch('/:id', validateObjectId(), validate(updateRecipeSchema), update);
router.delete('/:id', validateObjectId(), remove);
router.patch('/:id/publish', validateObjectId(), validate(publishRecipeSchema), publish);
router.patch('/:id/feature', validateObjectId(), validate(featureRecipeSchema), feature);

export default router;
