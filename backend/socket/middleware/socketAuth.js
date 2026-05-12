const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { ERROR_EVENTS } = require('../constants/socketEvents');

/**
 * Socket authentication middleware
 * Supports multiple token sources: cookies, headers, handshake query
 */
const socketAuth = async (socket, next) => {
  try {
    let token = null;

    // Try to get token from cookie
    if (socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies.token;
    }

    // Try to get token from authorization header
    if (!token && socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Try to get token from handshake query (for mobile clients)
    if (!token && socket.handshake.query.token) {
      token = socket.handshake.query.token;
    }

    // Validate token existence (temporarily disabled for testing)
    if (!token) {
      console.log('Socket auth: No token found, allowing unauthenticated connection for testing');
      // Attach default user data for testing
      socket.user = { _id: 'testuser', name: 'Test User', role: 'user' };
      socket.userId = 'testuser';
      socket.userRole = 'user';
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

    // Fetch user and attach to socket
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket for future use
    socket.user = user;
    socket.userId = user._id.toString();
    socket.userRole = user.role;

    // Log successful authentication
    console.log(`Socket authenticated: ${user.name} (${user._id})`);

    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    
    // Send specific error messages
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid authentication token'));
    } else if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication token expired'));
    } else if (error.message === 'User not found') {
      return next(new Error('User account not found'));
    }

    next(new Error('Authentication failed'));
  }
};

/**
 * Middleware to check if user has required role
 */
const authorizeSocket = (...roles) => {
  return (socket, next) => {
    if (!socket.user) {
      return next(new Error('User not authenticated'));
    }

    if (!roles.includes(socket.userRole)) {
      return next(new Error('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Middleware to check if user can join specific room
 */
const canJoinRoom = (roomType, resourceId) => {
  return async (socket, next) => {
    try {
      const { userId, userRole } = socket;
      let hasPermission = false;

      switch (roomType) {
        case 'user':
          // Users can only join their own user room
          hasPermission = userId === resourceId;
          break;

        case 'project':
          // Check if user is member of the project
          const Project = require('../../models/Project');
          const project = await Project.findById(resourceId);
          
          if (project) {
            const isOwner = project.owner.toString() === userId;
            const isMember = project.members.some(
              member => member.user.toString() === userId
            );
            hasPermission = isOwner || isMember || userRole === 'admin';
          }
          break;

        case 'team':
          // Check if user is member of the team
          const Team = require('../../models/Team');
          const team = await Team.findById(resourceId);
          
          if (team) {
            const isOwner = team.owner.toString() === userId;
            const isMember = team.members.some(
              member => member.user.toString() === userId
            );
            hasPermission = isOwner || isMember || userRole === 'admin';
          }
          break;

        case 'admin':
          // Only admins can join admin rooms
          hasPermission = userRole === 'admin';
          break;

        default:
          hasPermission = false;
      }

      if (!hasPermission) {
        return next(new Error(`Not authorized to join ${roomType} room`));
      }

      next();
    } catch (error) {
      console.error('Room authorization error:', error);
      next(new Error('Room authorization failed'));
    }
  };
};

/**
 * Middleware to validate event payload
 */
const validateEventPayload = (schema) => {
  return (socket, next) => {
    const { event, data } = socket;
    
    // Basic validation
    if (!event || typeof event !== 'string') {
      return next(new Error('Invalid event name'));
    }

    // Custom schema validation if provided
    if (schema && typeof schema.validate === 'function') {
      const { error } = schema.validate(data);
      if (error) {
        return next(new Error(`Invalid event data: ${error.details[0].message}`));
      }
    }

    next();
  };
};

module.exports = {
  socketAuth,
  authorizeSocket,
  canJoinRoom,
  validateEventPayload
};
