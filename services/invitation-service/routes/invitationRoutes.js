import express from 'express';
import { getAllInvitations, getInvitation, getPendingRespondedInvitations, getRecentScheduledInvitations, updateInvitation } from '../controllers/invitationController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/get-all-invitations', protect, getAllInvitations);
router.get('/get-invitation/:id', protect, getInvitation);
router.get('/get-recent-scheduled', protect, getRecentScheduledInvitations);
router.get('/get-pending-responded', protect, getPendingRespondedInvitations);
router.post('/update-invitation/:id', protect, updateInvitation);

export default router;