import { Router } from 'express';
import { list, remove, review } from '../controllers/admin.submission.controller.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { adminSubmissionsQuery, reviewSubmissionSchema } from '../validators/community.validators.js';

const router = Router();

router.get('/', validate(adminSubmissionsQuery, 'query'), list);
router.patch('/:id/review', validateObjectId(), validate(reviewSubmissionSchema), review);
router.delete('/:id', validateObjectId(), remove);

export default router;
