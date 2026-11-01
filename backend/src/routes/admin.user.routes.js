import { Router } from 'express';
import { get, list, updateStatus } from '../controllers/admin.user.controller.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { adminUsersQuery, userStatusSchema } from '../validators/user.validators.js';

const router = Router();

router.get('/', validate(adminUsersQuery, 'query'), list);
router.get('/:id', validateObjectId(), get);
router.patch('/:id/status', validateObjectId(), validate(userStatusSchema), updateStatus);

export default router;
