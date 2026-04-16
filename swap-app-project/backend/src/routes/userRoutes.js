const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

// Todas las rutas de usuario requieren autenticación
router.use(verifyToken);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/search', userController.searchUsers);
router.get('/friends', userController.getFriends);
router.post('/friends', userController.addFriend);
router.delete('/friends/:friendId', userController.removeFriend);

module.exports = router;
