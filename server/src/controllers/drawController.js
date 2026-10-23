const WinnerService = require('../services/winnerService');
const { AppError } = require('../middleware/errorMiddleware');

exports.drawWinner = async (req, res, next) => {
  try {
    const { roundId, eventId } = req.body;
    const adminId = req.user.id;

    if (!roundId || !eventId) {
      throw new AppError('roundId and eventId are required', 400);
    }

    const result = await WinnerService.drawWinner(roundId, eventId, adminId);

    // Note: Socket.IO emission will happen in the controller or via a separate event emitter
    // For now, we return the result. The app.js will be updated to handle Socket.IO.
    
    res.status(200).json({
      status: 'success',
      data: {
        round: result.round,
        winner: result.winner
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getRoundStatus = async (req, res, next) => {
  try {
    const { roundId } = req.params;
    const Round = require('../models/Round');
    const round = await Round.findById(roundId).populate('winner');
    if (!round) throw new AppError('Round not found', 404);
    res.status(200).json({ status: 'success', data: round });
  } catch (err) {
    next(err);
  }
};
