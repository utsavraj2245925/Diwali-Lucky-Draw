const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const prizeController = require('../controllers/prizeController');
const eventController = require('../controllers/eventController');

router.use(authMiddleware.protect);

// Prize Routes
router.route('/prizes')
  .get(prizeController.getAllPrizes)
  .post(prizeController.createPrize);

router.route('/prizes/:id')
  .patch(prizeController.updatePrize)
  .delete(prizeController.deletePrize);

// Event Routes
router.route('/events')
  .post(eventController.createEvent);

router.route('/events/:id')
  .get(eventController.getEvent)
  .patch(eventController.updateEventStatus);

router.patch('/events/:eventId/initialize-rounds', eventController.initializeDefaultRounds);

module.exports = router;
