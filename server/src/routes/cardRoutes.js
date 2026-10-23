const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const cardController = require('../controllers/cardController');

const router = express.Router();

router.get('/', protect, cardController.getCards);
router.patch('/:id/status', protect, cardController.updateCardStatus);
router.post('/assign', protect, cardController.assignCard);
router.patch('/:id/token', protect, cardController.generateQRToken);
router.get('/export', protect, cardController.exportCardMappings);

module.exports = router;
