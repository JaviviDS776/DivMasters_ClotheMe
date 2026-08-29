const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configuración segura de Multer con límite de 5MB y filtro de imágenes
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5 MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, WEBP)'), false);
    }
  }
});

// Obtener todos los posts (Feed) - Público
router.get('/', postController.getPosts);

// Rutas protegidas
router.get('/my-posts', verifyToken, postController.getMyPosts);
router.post('/', verifyToken, upload.single('image'), postController.createPost);
router.post('/:id/like', verifyToken, postController.toggleLike);
router.post('/:id/comment', verifyToken, postController.addComment);
router.get('/:id/comments', postController.getComments);

module.exports = router;

