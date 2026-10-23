const jwt = require('jsonwebtoken');
const { Admin } = require('../models/Admin'); // This might need fixing depending on how models are exported
const { AppError } = require('../middleware/errorMiddleware');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { admin: user }
  });
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new AppError('Please provide username and password', 400));
    }

    const admin = await require('../models/Admin').findOne({ username }).select('+password');

    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      return next(new AppError('Incorrect username or password', 401));
    }

    createSendToken(admin, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now()),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};
