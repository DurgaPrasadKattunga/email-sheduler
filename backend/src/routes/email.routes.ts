import { Router } from 'express';
import { emailController } from '../controllers/email.controller';

const router = Router();

router.post('/schedule', emailController.schedule);
router.get('/scheduled', emailController.getScheduled);
router.get('/sent', emailController.getSent);
router.get('/search', emailController.search);
router.get('/:id', emailController.getById);
router.post('/:id/cancel', emailController.cancel);

export const emailRouter = router;
