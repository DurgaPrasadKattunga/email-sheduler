import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';

const router = Router();

router.post('/', campaignController.create);
router.get('/', campaignController.list);
router.get('/:id', campaignController.getById);
router.delete('/:id', campaignController.delete);

export const campaignRouter = router;
