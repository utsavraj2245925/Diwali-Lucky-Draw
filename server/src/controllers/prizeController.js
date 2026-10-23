const { Prize } = require('../models/Prize');
const { AppError } = require('../middleware/errorMiddleware');

exports.createPrize = async (req, res, next) => {
  try {
    const prize = await Prize.create(req.body);
    res.status(201).json({ status: 'success', data: prize });
  } catch (err) {
    next(err);
  }
};

exports.getAllPrizes = async (req, res, next) => {
  try {
    const prizes = await Prize.find();
    res.status(200).json({ status: 'success', data: prizes });
  } catch (err) {
    next(err);
  }
};

exports.updatePrize = async (req, res, next) => {
  try {
    const prize = await Prize.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!prize) throw new AppError('Prize not found', 404);
    res.status(200).json({ status: 'success', data: prize });
  } catch (err) {
    next(err);
  }
};

exports.deletePrize = async (req, res, next) => {
  try {
    const prize = await Prize.findByIdAndDelete(req.params.id);
    if (!prize) throw new AppError('Prize not found', 404);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
