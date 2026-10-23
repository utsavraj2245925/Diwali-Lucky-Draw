const { Event, Round } = require('../models/Event'); // Note: I need to fix the destructuring here
const { AppError } = require('../middleware/errorMiddleware');
const mongoose = require('mongoose');

// Re-importing models correctly
const EventModel = require('../models/Event');
const RoundModel = require('../models/Round');
const PrizeModel = require('../models/Prize');

exports.createEvent = async (req, res, next) => {
  try {
    const event = await EventModel.create(req.body);
    res.status(201).json({ status: 'success', data: event });
  } catch (err) {
    next(err);
  }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) throw new AppError('Event not found', 404);
    res.status(200).json({ status: 'success', data: event });
  } catch (err) {
    next(err);
  }
};

exports.updateEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const event = await EventModel.findById(req.params.id);
    if (!event) throw new AppError('Event not found', 404);

    // Transition Logic: DRAFT -> READY -> LIVE -> COMPLETED
    const statusOrder = { 'DRAFT': 0, 'READY': 1, 'LIVE': 2, 'COMPLETED': 3 };
    if (statusOrder[status] < statusOrder[event.status]) {
      throw new AppError('Cannot move event to a previous status', 400);
    }

    // Lock config when moving to READY or LIVE
    let locked = event.config.locked;
    if (['READY', 'LIVE'].includes(status)) {
      locked = true;
    }

    event.status = status;
    event.config.locked = locked;
    if (status === 'LIVE') event.startedAt = new Date();
    if (status === 'COMPLETED') event.completedAt = new Date();

    await event.save();
    res.status(200).json({ status: 'success', data: event });
  } catch (err) {
    next(err);
  }
};

exports.initializeDefaultRounds = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await EventModel.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    if (event.config.locked) throw new AppError('Event is locked. Cannot initialize rounds.', 400);

    const categories = ['Manager', 'Company Staff', 'Company Worker'];
    const rounds = [];

    // We need at least 9 prizes to initialize default rounds
    const prizes = await PrizeModel.find().limit(9);
    if (prizes.length < 9) {
      throw new AppError('At least 9 prizes must be created before initializing default rounds.', 400);
    }

    let prizeIndex = 0;
    let order = 1;
    for (const category of categories) {
      for (let roundNum = 1; roundNum <= 3; roundNum++) {
        rounds.push({
          category,
          roundNumber: roundNum,
          prize: prizes[prizeIndex]._id,
          order: order++,
          status: 'PENDING'
        });
        prizeIndex++;
      }
    }

    await RoundModel.insertMany(rounds);
    res.status(201).json({ status: 'success', message: '9 default rounds initialized' });
  } catch (err) {
    next(err);
  }
};
