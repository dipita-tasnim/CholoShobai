// Admin middleware to protect admin routes
const isAdmin = (req, res, next) => {
    // User should already be authenticated with authUser middleware
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
};

module.exports = { isAdmin };