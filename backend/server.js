require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initializeSocket, shutdownSocket } = require('./socket');

// Connect to database
connectDB();

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Initialize Socket.io after server starts
  try {
    initializeSocket(server);
    console.log('Socket.io initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Socket.io:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  
  try {
    await shutdownSocket();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  
  try {
    await shutdownSocket();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
