const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const importController = require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), importController.uploadAndPreview);
router.post('/confirm', protect, importController.confirmImport);

module.exports = router;
