const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { globalErrorHandler, AppError } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const importRoutes = require('./routes/importRoutes');
const cardRoutes = require('./routes/cardRoutes');
const eventRoutes = require('./routes/eventRoutes');
const eventSummaryRoutes = require('./routes/eventSummaryRoutes');
const drawRoutes = require('./routes/drawRoutes');
const drawSummaryRoutes = require('./routes/drawSummaryRoutes');
const seedAdmin = require('./services/seed');
require('dotenv').config();

// Connect to Database
connectDB();

// Idempotent Admin Seed
seedAdmin();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/event-summary', eventSummaryRoutes);
app.use('/api/v1/draw', drawRoutes);
app.use('/api/v1/draw-summary', drawSummaryRoutes);

// Health Check
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok', 
    database: dbStatus,
    uptime: process.uptime(),
    message: 'Server is running' 
  });
});

app.get('/', (req, res) => {
  res.send('PG Group Grand Diwali Lucky Draw API is running');
});

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Middleware
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
