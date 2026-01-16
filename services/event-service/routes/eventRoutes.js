import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { addEvent, getAllEvents, getEvent, editEvent, deleteEvent, getRecentScheduledEvents } from '../controllers/eventContoller.js';
// const { updateStatus, inviteEmail } = require('../controllers/emailController');

const router = express.Router();

router.post('/add-event', protect, addEvent);
router.get('/get-all-events', protect, getAllEvents);
router.get('/get-event/:id', protect, getEvent);
router.put('/edit-event/:id', protect, editEvent);
router.delete('/delete-event/:id', protect, deleteEvent);
router.get('/get-recent-scheduled', protect, getRecentScheduledEvents);


//invite-routes
// router.post('/get-event/:id/invite', inviteEmail);
// router.get('/get-event/:id/status', updateStatus);

export default router;