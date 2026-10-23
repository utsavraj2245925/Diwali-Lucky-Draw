const express = require('express');
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

router.post('/login', loginLimiter, authController.login);
router.get('/logout', authController.logout);

module.exports = router;
