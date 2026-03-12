const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Obtener todos los posts (Feed) - Puede ser público
router.get('/', postController.getPosts);

// Rutas protegidas
router.post('/', verifyToken, upload.single('image'), postController.createPost);
router.post('/:id/like', verifyToken, postController.toggleLike);
router.post('/:id/comment', verifyToken, postController.addComment);
router.get('/:id/comments', postController.getComments);

module.exports = router;
