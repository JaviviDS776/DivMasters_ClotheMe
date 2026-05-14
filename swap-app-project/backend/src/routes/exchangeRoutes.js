const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchangeController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', exchangeController.proposeExchange);
router.get('/', exchangeController.getExchanges);
router.put('/:exchangeId', exchangeController.updateExchangeStatus);
router.put('/admin/:exchangeId', verifyAdmin, exchangeController.adminUpdateExchangeStatus);

module.exports = router;
