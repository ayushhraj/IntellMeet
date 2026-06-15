import { Router } from 'express';
import {
  createMeeting, getMeetings, getMeeting, getMeetingByRoom,
  joinMeeting, endMeeting, updateMeetingSummary, getDashboardStats
} from '../controllers/meeting.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/dashboard', getDashboardStats);
router.get('/room/:roomId', getMeetingByRoom);
router.get('/:id', getMeeting);
router.post('/join/:roomId', joinMeeting);
router.put('/:id/end', endMeeting);
router.put('/:id/summary', updateMeetingSummary);

export default router;
