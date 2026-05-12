const InvitationEvents = require('./invitationEvents');
const NotificationEvents = require('./notificationEvents');
const TeamEvents = require('./teamEvents');
const ProjectEvents = require('./projectEvents');

/**
 * Setup all event handlers
 */
const setupEventHandlers = (io, connectionManager) => {
  try {
    console.log('Setting up Socket.io event handlers...');

    // Initialize event handlers
    const invitationEvents = new InvitationEvents(connectionManager);
    const notificationEvents = new NotificationEvents(connectionManager);
    const teamEvents = new TeamEvents(connectionManager);
    const projectEvents = new ProjectEvents(connectionManager);

    // Store handlers for cleanup
    const eventHandlers = {
      invitation: invitationEvents,
      notification: notificationEvents,
      team: teamEvents,
      project: projectEvents
    };

    // Setup cleanup on server shutdown
    process.on('SIGTERM', () => {
      console.log('Cleaning up event handlers...');
      cleanupEventHandlers(eventHandlers);
    });

    process.on('SIGINT', () => {
      console.log('Cleaning up event handlers...');
      cleanupEventHandlers(eventHandlers);
    });

    console.log('Socket.io event handlers setup complete');
    return eventHandlers;

  } catch (error) {
    console.error('Error setting up event handlers:', error);
    throw error;
  }
};

/**
 * Cleanup all event handlers
 */
const cleanupEventHandlers = (eventHandlers) => {
  try {
    Object.values(eventHandlers).forEach(handler => {
      if (handler.cleanup && typeof handler.cleanup === 'function') {
        handler.cleanup();
      }
    });
    console.log('Event handlers cleanup complete');
  } catch (error) {
    console.error('Error cleaning up event handlers:', error);
  }
};

/**
 * Get event handler statistics
 */
const getEventStats = (eventHandlers) => {
  try {
    const stats = {};
    
    Object.entries(eventHandlers).forEach(([type, handler]) => {
      stats[type] = {
        active: true,
        methods: Object.getOwnPropertyNames(handler.constructor.prototype)
          .filter(method => method.startsWith('handle'))
      };
    });

    return stats;
  } catch (error) {
    console.error('Error getting event stats:', error);
    return {};
  }
};

module.exports = {
  setupEventHandlers,
  cleanupEventHandlers,
  getEventStats
};
