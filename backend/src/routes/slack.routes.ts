import { Router } from 'express';
import { slackController } from '../controllers/slack.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/connect', authenticate, slackController.connect);
router.get('/callback', slackController.callback);
router.post('/disconnect', authenticate, slackController.disconnect);
router.get('/status', authenticate, slackController.status);

export const slackRouter = router;
