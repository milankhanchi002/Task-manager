const socketServer = require('./socketServer');

/**
 * Initialize Socket.io with Express server
 */
const initializeSocket = (server) => {
  try {
    return socketServer.initialize(server);
  } catch (error) {
    console.error('Failed to initialize Socket.io:', error);
    throw error;
  }
};

/**
 * Get Socket.io instance
 */
const getSocketIO = () => {
  return socketServer.getIO();
};

/**
 * Get connection manager
 */
const getConnectionManager = () => {
  return socketServer.getConnectionManager();
};

/**
 * Get socket server statistics
 */
const getSocketStats = () => {
  return socketServer.getStats();
};

/**
 * Health check for socket server
 */
const healthCheck = () => {
  return socketServer.healthCheck();
};

/**
 * Graceful shutdown
 */
const shutdownSocket = async () => {
  try {
    await socketServer.shutdown();
  } catch (error) {
    console.error('Error during socket shutdown:', error);
  }
};

module.exports = {
  initializeSocket,
  getSocketIO,
  getConnectionManager,
  getSocketStats,
  healthCheck,
  shutdownSocket
};
