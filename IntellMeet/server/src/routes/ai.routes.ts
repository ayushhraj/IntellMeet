import { Router } from 'express';
import { summarizeMeeting, transcribeAudio } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.post('/summarize', summarizeMeeting);
router.post('/transcribe', transcribeAudio);

export default router;
