const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const eventSummaryController = require('../controllers/eventSummaryController');

router.use(authMiddleware.protect);

router.get('/current', eventSummaryController.getCurrentEvent);
router.get('/rounds', eventSummaryController.getAllRounds);

module.exports = router;
