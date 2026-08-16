const express = require('express');
const router = express.Router();
const Notification = require('../models/notification.model');
const { authUser } = require('../middlewares/auth.middleware');

// Any logged-in user can read the latest global announcements. Admin-only
// alerts (such as new signups) are filtered out for regular accounts; the
// $ne check also covers older documents saved before `audience` existed.
router.get('/', authUser, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { audience: { $ne: 'admin' } };
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
});

module.exports = router;
