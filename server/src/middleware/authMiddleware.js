const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorMiddleware');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const Admin = require('../models/Admin');
    const currentAdmin = await Admin.findById(decoded.id);

    if (!currentAdmin) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.admin = currentAdmin;
    next();
  } catch (err) {
    next(new AppError('Invalid token. Please log in again!', 401));
  }
};
