const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const drawController = require('../controllers/drawController');

router.use(authMiddleware.protect);

router.post('/draw', drawController.drawWinner);
router.get('/round/:roundId', drawController.getRoundStatus);

module.exports = router;
