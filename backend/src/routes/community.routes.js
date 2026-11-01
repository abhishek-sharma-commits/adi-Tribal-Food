import { Router } from 'express';
import { create, gallery, mine, mineById, remove, update } from '../controllers/community.controller.js';
import { authenticate } from '../middleware/auth.js';
import { submissionLimiter } from '../middleware/rateLimiters.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import {
  createSubmissionSchema,
  galleryQuery,
  mySubmissionsQuery,
  updateSubmissionSchema,
} from '../validators/community.validators.js';

const router = Router();

router.get('/gallery', validate(galleryQuery, 'query'), gallery);

router.post('/submissions', authenticate, submissionLimiter, validate(createSubmissionSchema), create);
router.get('/submissions/mine', authenticate, validate(mySubmissionsQuery, 'query'), mine);
router.get('/submissions/mine/:id', authenticate, validateObjectId(), mineById);
router.patch('/submissions/:id', authenticate, validateObjectId(), validate(updateSubmissionSchema), update);
router.delete('/submissions/:id', authenticate, validateObjectId(), remove);

export default router;
