const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

module.exports.authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization header missing or invalid" });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Check if token is blacklisted
        const isBlacklisted = await userModel.findOne({ token: token });
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Token is blacklisted' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded._id).select('-password');

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;
            next();
        } catch (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({ message: "Invalid token" });
        }
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ message: "Server error" });
    }
};
