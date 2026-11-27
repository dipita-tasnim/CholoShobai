const userModel = require('../models/user.model');
const BlacklistToken = require('../models/blacklistToken.model');
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

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Both lookups run at the same time so a request waits for one
        // database round trip instead of two. The blacklist check uses its own
        // indexed collection, which is where logout writes tokens.
        const [isBlacklisted, user] = await Promise.all([
            BlacklistToken.exists({ token }),
            userModel.findById(decoded._id).select('-password')
        ]);

        if (isBlacklisted) {
            return res.status(401).json({ message: 'Token is blacklisted' });
        }

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.status === 'suspended' || user.status === 'banned') {
            return res.status(403).json({ message: `Your account has been ${user.status}.` });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ message: "Server error" });
    }
};
