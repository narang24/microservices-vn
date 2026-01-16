import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'
import User from "../models/User.js"
import { produceData } from "../utils/kafka.js"

const generateToken = (id) => {
    return jwt.sign({ id },process.env.JWT_SECRET,{ expiresIn: '1d' })
}

const generateVerifyToken = (id) => {
    return jwt.sign({ id },process.env.JWT_VERIFY_SECRET,{ expiresIn: '1h' })
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password)
        return res.status(400).json({ message: 'All fields are required' });

    try {
        const user = await User.findOne({ email });
        if(!user)
            return res.status(404).json({ message: 'User not found' });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid)
            return res.status(401).json({ message: 'Invalid Credentials' });

        produceData({ topic: 'auth-successful', message: {user, type: 'login'}});

        res.status(200).json({
            user,
            token: generateToken(user._id),
            message: 'Login Successfull!'
        })
    } catch(error) {
        res.status(500).json({ message: 'Error logging in' });
    }
}

const signupUser = async (req, res) => {
    const { username, email, password, profileImageUrl } = req.body;

    if(!username || !email || !password)
        return res.status(400).json({ message: 'All fields are required' });

    try {
        const userExists = await User.findOne({ email });
        if(userExists)
            return res.status(409).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            profileImageUrl,
            isVerified: false,
        })

        produceData({topic: 'auth-successful', message: {user, type: 'verifyEmail'}});
        // const verifyToken = generateVerifyToken(user._id)
        // const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify?token=${verifyToken}`

        // await sendMail(email,'Verify your account',`
        //     <p>Welcome, ${username}!</p>
        //     <p>Click the link below to verify your account:</p>
        //     <a href="${verifyUrl}">${verifyUrl}</a>
        // `);

        res.status(201).json({
            id: user._id,
            user,
            token: generateToken(user._id),
            message: 'SignUp Successfull. Please check your email to verify.'
        });

    } catch (error) {
        res.status(500).json({ message: 'Error signing up' })
    }

}

const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if(!user)
            return res.status(404).json({ message: 'User not found' })
        res.status(200).json(user);
    } catch(error) {
        res.status(500).json({ message: 'Error fetching details' });
    }
}

const verifyUser = async (req, res) => {
    const token = req.query.token;
    if(!token)
        return res.status(400).json('No token found');

    try {
        const decoded = jwt.verify(token,process.env.JWT_VERIFY_SECRET);
        const user = await User.findById(decoded.id);
        if(!user)
            return res.status(404).json({ message: 'User not found' })
        if(user.isVerified)
            return res.redirect(`${process.env.CLIENT_URL}/verified?ok=1`)
        user.isVerified = true
        user.verifiedAt = Date.now()
        await user.save();

        res.redirect(`${process.env.CLIENT_URL}/verified?ok=1`)

    } catch(error) {
        res.status(500).json({ message: 'Error verifying user', error: error.message });
    }
}

const resendVerifyEmail = async (req, res) => {
    const { email } = req.body;
    if(!email)
        return res.status(400).json({ message: 'Email is required' })

    try {
        const user = await User.findOne({ email });
        if(!user)
            return res.status(404).json({ message: 'User not found' })
        if(user.isVerified)
            return res.status(409).json({ message: 'User already verified' })

        produceData({topic: 'auth-successful', message: { user, type: 'verifyEmail' } });
        // const verifyToken = generateVerifyToken(user._id);
        // const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify?token=${verifyToken}`;

        // await sendMail(email,'Verify your account',`
        //     <p>Welcome, ${user.username}!</p>
        //     <p>Click the link below to verify your account:</p>
        //     <a href="${verifyUrl}">${verifyUrl}</a>
        // `);

        res.status(200).json({ message: 'Resent verification email' });

    } catch(error) {
        res.status(500).json({ message: 'Error resending verification email', error: error.message })
    }
}

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if(!user)
            return res.status(404).json({ message: 'User not found' });

        // const resetToken = jwt.sign({ id: user._id },process.env.JWT_PASSWORD_SECRET,{ expiresIn: '15m' });
        // const resetUrl = `${process.env.CLIENT_URL}/forgot-password?token=${resetToken}`;

        produceData({ topic: 'auth-successful', message: {user, type:'forgotPassword'} });        
        // await sendMail(user.email, 'Reset your Password',`
        //    <h3>Forgot your password?</h3> 
        //    <p>Click on the link below to reset (valid 15 min)</p>
        //    <a href="${resetUrl}">${resetUrl}</a>
        // `);

        res.status(200).json({ message: 'Email sent to reset Password' });

    } catch(error) {
        res.status(500).json({ message: 'Error in sending reset password email'})
    }
}

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if(!password)
        return res.status(400).json({ message: 'Password is required' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_PASSWORD_SECRET);
        const user = await User.findOne({ _id: decoded.id });
        if(!user)
            return res.status(404).json({ message: 'User not found' });
        const hashedPassword = await bcrypt.hash(password,10);
        user.password = hashedPassword;
        await user.save();

        produceData({ topic: 'auth-successful', message: {user, type:'resetPassword'} });

        res.status(200).json({ message: 'Password Changed Successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Invalid or expired Token', error: error.message })
    }
}

const checkInvitee = async(req, res) => {
    const { email } = req.query;
    try {
        const user = await User.findOne({ email });
        if(!user) return res.json({ user: null });
        res.json({ user });
    } catch(error) {
        res.status(500).json({ message:'Error identifying invitee as user', error });
    }
}

const verifyToken = async (req, res) => {
    const userId = req.user.id;
    try {
    const user = await User.findOne({ _id: userId });
    if(!user) return res.status(404).json({ user: null });
    res.status(200).json({ user });
    } catch(error) {
        res.status(500).json('Server Error');
    }
}

export {loginUser, signupUser, getUser, verifyUser, resendVerifyEmail, forgotPassword, resetPassword, checkInvitee, verifyToken};