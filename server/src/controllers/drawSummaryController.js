const Event = require('../models/Event');
const Round = require('../models/Round');
const { AppError } = require('../middleware/errorMiddleware');

exports.getCurrentDrawState = async (req, res, next) => {
  try {
    const event = await Event.findOne().sort({ createdAt: 1 });
    if (!event) throw new AppError('No event found', 404);

    const lastRound = await Round.findOne({ status: 'COMPLETED' }).sort({ order: -1 }).populate('winner prize');
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
        currentRound: lastRound,
        winner: lastRound?.winner || null,
        status: lastRound ? 'REVEALED' : 'IDLE'
      }
    });
  } catch (err) {
    next(err);
  }
};
