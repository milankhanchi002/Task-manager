// Socket event constants for type safety and maintainability

// Connection events
export const CONNECTION_EVENTS = {
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  JOIN_USER_ROOM: 'join:user_room',
  LEAVE_USER_ROOM: 'leave:user_room',
  JOIN_PROJECT_ROOM: 'join:project_room',
  LEAVE_PROJECT_ROOM: 'leave:project_room',
  JOIN_TEAM_ROOM: 'join:team_room',
  LEAVE_TEAM_ROOM: 'leave:team_room'
};

// Invitation events
export const INVITATION_EVENTS = {
  SENT: 'invitation:sent',
  ACCEPTED: 'invitation:accepted',
  REJECTED: 'invitation:rejected',
  CANCELLED: 'invitation:cancelled',
  UPDATED: 'invitation:updated'
};

// Notification events
export const NOTIFICATION_EVENTS = {
  NEW: 'notification:new',
  READ: 'notification:read',
  COUNT_UPDATE: 'notification:count:update',
  MARK_ALL_READ: 'notification:mark_all_read'
};

// Team events
export const TEAM_EVENTS = {
  MEMBER_JOINED: 'team:member:joined',
  MEMBER_LEFT: 'team:member:left',
  MEMBER_UPDATED: 'team:member:updated',
  TEAM_UPDATED: 'team:updated'
};

// Project events
export const PROJECT_EVENTS = {
  MEMBER_ADDED: 'project:member:added',
  MEMBER_REMOVED: 'project:member:removed',
  MEMBER_UPDATED: 'project:member:updated',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_CREATED: 'project:created',
  PROJECT_DELETED: 'project:deleted'
};

// Error events
export const ERROR_EVENTS = {
  AUTHENTICATION_FAILED: 'error:authentication_failed',
  AUTHORIZATION_FAILED: 'error:authorization_failed',
  VALIDATION_FAILED: 'error:validation_failed',
  ROOM_JOIN_FAILED: 'error:room_join_failed',
  GENERAL_ERROR: 'error:general'
};

// Room constants
export const ROOM_TYPES = {
  USER: 'user',
  PROJECT: 'project',
  TEAM: 'team',
  ADMIN: 'admin'
};

// Event payload structure
export const createEventPayload = (type, data, userId = null, metadata = {}) => {
  return {
    type,
    data,
    timestamp: new Date().toISOString(),
    userId,
    metadata: {
      source: 'task-manager-server',
      version: '1.0.0',
      ...metadata
    }
  };
};

// Room name generators
export const getRoomName = (type, id) => {
  return `${type}:${id}`;
};

export const getUserRoomName = (userId) => {
  return getRoomName(ROOM_TYPES.USER, userId);
};

export const getProjectRoomName = (projectId) => {
  return getRoomName(ROOM_TYPES.PROJECT, projectId);
};

export const getTeamRoomName = (teamId) => {
  return getRoomName(ROOM_TYPES.TEAM, teamId);
};

export const getAdminRoomName = (userId) => {
  return getRoomName(ROOM_TYPES.ADMIN, userId);
};
