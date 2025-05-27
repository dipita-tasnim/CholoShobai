const express = require('express');
const router = express.Router();
const { body } = require("express-validator");
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Keep only this one
router.post('/register', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('firstname').isLength({ min: 3 }).withMessage('First name must be at least 3 character'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 character'),   
],
    userController.registerUser
);

// login route
router.post(
    '/login',
    [ 
        body('email').isEmail().withMessage('Invalid Email'),
        body('password').isLength({ min: 6 }).withMessage('Password invalid')
    ],
    userController.loginUser
);

// get all users
router.get('/', authMiddleware.authUser, userController.getAllUsers);

// search users - must be before /:id route
router.get('/search', authMiddleware.authUser, userController.searchUsers);

// profile route
router.get('/profile', authMiddleware.authUser, userController.getUserProfile);

// Fetch user by ID
router.get('/:id', authMiddleware.authUser, userController.getUserById);

// logout route
router.get('/logout', authMiddleware.authUser, userController.logoutUser);

// get a specific user by ID - must be after all specific routes
router.get('/:id', authMiddleware.authUser, userController.getUserById);

//Delete a user
router.delete('/:id', authMiddleware.authUser, userController.deleteUser);
router.get('/admins', authMiddleware.authUser, userController.getAdmins);

module.exports = router;
