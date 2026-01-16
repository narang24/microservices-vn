import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { loginUser, forgotPassword, getUser, resendVerifyEmail, resetPassword, signupUser, verifyUser, checkInvitee, verifyToken } from "../controllers/authController.js";

const router = express.Router();

router.post('/login', loginUser);
router.post('/signup', signupUser);
router.get('/get-user', protect, getUser);
router.get('/verify', verifyUser);
router.post('/resend-email', resendVerifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/verify-token', protect, verifyToken);
router.get('/check-invitee', checkInvitee);

export default router;