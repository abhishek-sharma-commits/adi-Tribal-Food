import { Router } from 'express';
import { create, feature, get, list, publish, remove, update } from '../controllers/admin.media.controller.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import {
  adminMediaListQuery,
  createMediaSchema,
  featureMediaSchema,
  publishMediaSchema,
  updateMediaSchema,
} from '../validators/media.validators.js';

const router = Router();

router.get('/', validate(adminMediaListQuery, 'query'), list);
router.post('/', validate(createMediaSchema), create);
router.get('/:id', validateObjectId(), get);
router.patch('/:id', validateObjectId(), validate(updateMediaSchema), update);
router.delete('/:id', validateObjectId(), remove);
router.patch('/:id/publish', validateObjectId(), validate(publishMediaSchema), publish);
router.patch('/:id/feature', validateObjectId(), validate(featureMediaSchema), feature);

export default router;
