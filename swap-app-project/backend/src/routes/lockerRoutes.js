const router = require('express').Router();
const { assignLocker } = require('../controllers/lockerController');
const verifyToken = require('../middleware/authMiddleware'); // Importamos el guardia

// Protegemos la ruta. Ahora SOLO usuarios logueados pueden pedir casilleros.
router.post('/assign', verifyToken, assignLocker); 

module.exports = router;