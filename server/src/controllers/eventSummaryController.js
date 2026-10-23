const Event = require('../models/Event');
const Round = require('../models/Round');
const { AppError } = require('../middleware/errorMiddleware');

exports.getCurrentEvent = async (req, res, next) => {
  try {
    // Assuming the first created event is the current one for this specific use case
    const event = await Event.findOne().sort({ createdAt: 1 });
    if (!event) throw new AppError('No event has been created yet', 404);
    res.status(200).json({ status: 'success', data: event });
  } catch (err) {
    next(err);
  }
};

exports.getAllRounds = async (req, res, next) => {
  try {
    const rounds = await Round.find().sort('order').populate('prize');
    res.status(200).json({ status: 'success', data: rounds });
  } catch (err) {
    next(err);
  }
};
