const crypto = require('crypto');
const { AppError } = require('../middleware/errorMiddleware');
const Card = require('../models/Card');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

exports.getCards = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.cardNumber = { $regex: search, $options: 'i' };

    const cards = await Card.find(filter).populate('employee').sort({ cardNumber: 1 });
    res.status(200).json({ status: 'success', data: cards });
  } catch (err) {
    next(err);
  }
};

exports.updateCardStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const card = await Card.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true, runValidators: true }
    );

    if (!card) return next(new AppError('Card not found', 404));

    await AuditLog.create({
      action: 'UPDATE_CARD_STATUS',
      performedBy: req.admin._id,
      entity: 'Card',
      entityId: card._id,
      details: { oldStatus: card.status, newStatus: status }
    });

    res.status(200).json({ status: 'success', data: card });
  } catch (err) {
    next(err);
  }
};

exports.assignCard = async (req, res, next) => {
  try {
    const { employeeId, cardNumber } = req.body;
    if (!employeeId || !cardNumber) return next(new AppError('Missing employeeId or cardNumber', 400));

    const employee = await Employee.findOne({ employeeId });
    if (!employee) return next(new AppError('Employee not found', 404));

    const card = await Card.findOneAndUpdate(
      { cardNumber },
      { employee: employee._id, status: 'assigned' },
      { new: true }
    );

    if (!card) return next(new AppError('Card not found', 404));

    await AuditLog.create({
      action: 'ASSIGN_CARD',
      performedBy: req.admin._id,
      entity: 'Card',
      entityId: card._id,
      details: { employeeId: employee.employeeId, cardNumber: cardNumber }
    });

    res.status(200).json({ status: 'success', data: card });
  } catch (err) {
    next(err);
  }
};

exports.generateQRToken = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return next(new AppError('Card not found', 404));

    const token = crypto.randomBytes(32).toString('hex');
    card.qrToken = token;
    await card.save();

    res.status(200).json({ status: 'success', data: { cardNumber: card.cardNumber, qrToken: token } });
  } catch (err) {
    next(err);
  }
};

exports.exportCardMappings = async (req, res, next) => {
  try {
    const cards = await Card.find().populate('employee').lean();
    const csvHeader = 'Card Number,Employee Name,Employee ID,Category,QR Token\n';
    const csvRows = cards.map(c => 
      `"${c.cardNumber}","${c.employee?.name || ''}","${c.employee?.employeeId || ''}","${c.employee?.category || ''}","${c.qrToken || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=card_mappings.csv');
    res.status(200).send(csvHeader + csvRows);
  } catch (err) {
    next(err);
  }
};
