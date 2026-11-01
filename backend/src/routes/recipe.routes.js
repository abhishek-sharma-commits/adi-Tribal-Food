import { Router } from 'express';
import { getRecipe, listRecipes } from '../controllers/recipe.controller.js';
import { validate } from '../middleware/validate.js';
import { publicRecipeListQuery, slugParam } from '../validators/recipe.validators.js';

const router = Router();

router.get('/', validate(publicRecipeListQuery, 'query'), listRecipes);
router.get('/:slug', validate(slugParam, 'params'), getRecipe);

export default router;
