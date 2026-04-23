const express = require('express');
const router = express.Router();
const lockerController = require('../controllers/lockerController');
const verifyToken = require('../middleware/authMiddleware');

// Ruta para la APP (requiere login)
router.post('/assign', verifyToken, lockerController.assignLocker);

// Ruta de prueba
router.get('/test', (req, res) => res.json({ message: 'Locker routes are working' }));
router.get('/seed', lockerController.seedLockers);

// Ruta para el ESP32 (NO requiere login de usuario, usa API Key)
router.post('/verify', lockerController.verifyLockerCode);

module.exports = router;
