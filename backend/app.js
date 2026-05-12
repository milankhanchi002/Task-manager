const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Security Middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/projects', require('./routes/projectRoutes'));
app.use('/api/v1/tasks', require('./routes/taskRoutes'));
app.use('/api/v1/teams', require('./routes/teamRoutes'));
app.use('/api/v1/invitations', require('./routes/invitationRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('Task Manager API is running...');
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
