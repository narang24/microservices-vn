import axios from "axios";

const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if(!token) return res.status(401).json({ message: 'Unauthorized, no token!' });

    try {
        const { user } = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify-token`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if(!user) res.status(401).json({ message: 'Unauthorized, no token' });
        req.user = user;
        next();
    } catch(error) {
        res.status(401).json({ message: 'Unauthorized, token failed!'});
    }
}

export default protect;