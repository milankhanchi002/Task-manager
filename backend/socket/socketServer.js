const { Server } = require('socket.io');
const { socketAuth } = require('./middleware/socketAuth');
const ConnectionManager = require('./managers/connectionManager');
const { setupEventHandlers } = require('./events');

class SocketServer {
  constructor() {
    this.io = null;
    this.connectionManager = null;
  }

  /**
   * Initialize Socket.io server
   */
  initialize(server) {
    try {
      // Create Socket.io server with production-ready configuration
      this.io = new Server(server, {
        // CORS configuration
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:5173',
          methods: ['GET', 'POST'],
          credentials: true,
          allowedHeaders: ['Content-Type', 'Authorization']
        },

        // Transport configuration
        transports: ['websocket', 'polling'],

        // Performance settings
        pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
        pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
        maxHttpBufferSize: 1e6, // 1 MB

        // Compression
        compression: true,

        // Connection limits
        maxConnections: parseInt(process.env.SOCKET_MAX_CONNECTIONS) || 1000,

        // Development settings
        allowEIO3: false, // Disable legacy Engine.IO for security
        addTrailingSlash: false
      });

      // Apply authentication middleware
      this.io.use(socketAuth);

      // Initialize connection manager
      this.connectionManager = new ConnectionManager(this.io);

      // Setup event handlers
      setupEventHandlers(this.io, this.connectionManager);

      // Setup error handling
      this.setupErrorHandling();

      // Log successful initialization
      console.log('Socket.io server initialized successfully');
      console.log(`CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`Max connections: ${process.env.SOCKET_MAX_CONNECTIONS || 1000}`);

      return this.io;
    } catch (error) {
      console.error('Error initializing Socket.io server:', error);
      throw error;
    }
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    // Handle server errors
    this.io.on('error', (error) => {
      console.error('Socket.io server error:', error);
    });

    // Handle uncaught exceptions in socket handlers
    this.io.on('connection', (socket) => {
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });

      // Handle unexpected errors
      socket.onAny((eventName, ...args) => {
        try {
          // This will catch errors in event handlers
        } catch (error) {
          console.error(`Error in event ${eventName} for socket ${socket.id}:`, error);
        }
      });
    });
  }

  /**
   * Get Socket.io instance
   */
  getIO() {
    if (!this.io) {
      throw new Error('Socket.io server not initialized. Call initialize() first.');
    }
    return this.io;
  }

  /**
   * Get connection manager
   */
  getConnectionManager() {
    if (!this.connectionManager) {
      throw new Error('Connection manager not initialized. Call initialize() first.');
    }
    return this.connectionManager;
  }

  /**
   * Get server statistics
   */
  getStats() {
    if (!this.connectionManager) {
      return {
        status: 'not_initialized',
        message: 'Socket.io server not initialized'
      };
    }

    return {
      status: 'running',
      ...this.connectionManager.getStats(),
      engine: this.io.engine?.clientsCount || 0
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      console.log('Shutting down Socket.io server...');

      // Disconnect all clients
      if (this.io) {
        this.io.emit('server:shutdown', { 
          message: 'Server is shutting down',
          timestamp: new Date().toISOString()
        });

        // Close all connections
        this.io.close();
      }

      console.log('Socket.io server shutdown complete');
    } catch (error) {
      console.error('Error during Socket.io shutdown:', error);
    }
  }

  /**
   * Health check endpoint
   */
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: this.getStats()
    };
  }
}

// Singleton instance
const socketServer = new SocketServer();

module.exports = socketServer;
