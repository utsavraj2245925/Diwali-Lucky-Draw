const express = require('express');
const router = express.Router();
const drawSummaryController = require('../controllers/drawSummaryController');

router.get('/current-draw', drawSummaryController.getCurrentDrawState);

module.exports = router;
