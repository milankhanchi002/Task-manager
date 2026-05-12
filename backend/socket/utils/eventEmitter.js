const EventEmitter = require('events');

class SocketEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Prevent memory leak warnings
  }

  /**
   * Emit invitation events
   */
  emitInvitationSent(data) {
    this.emit('invitation:sent', data);
  }

  emitInvitationAccepted(data) {
    this.emit('invitation:accepted', data);
  }

  emitInvitationRejected(data) {
    this.emit('invitation:rejected', data);
  }

  emitInvitationCancelled(data) {
    this.emit('invitation:cancelled', data);
  }

  /**
   * Emit notification events
   */
  emitNotificationNew(data) {
    this.emit('notification:new', data);
  }

  emitNotificationRead(data) {
    this.emit('notification:read', data);
  }

  emitNotificationCountUpdate(data) {
    this.emit('notification:count:update', data);
  }

  /**
   * Emit team events
   */
  emitTeamMemberJoined(data) {
    this.emit('team:member:joined', data);
  }

  emitTeamMemberLeft(data) {
    this.emit('team:member:left', data);
  }

  emitTeamUpdated(data) {
    this.emit('team:updated', data);
  }

  /**
   * Emit project events
   */
  emitProjectMemberAdded(data) {
    this.emit('project:member:added', data);
  }

  emitProjectMemberRemoved(data) {
    this.emit('project:member:removed', data);
  }

  emitProjectUpdated(data) {
    this.emit('project:updated', data);
  }

  /**
   * Emit user events
   */
  emitUserOnline(data) {
    this.emit('user:online', data);
  }

  emitUserOffline(data) {
    this.emit('user:offline', data);
  }

  /**
   * Safe emit with error handling
   */
  safeEmit(event, data) {
    try {
      this.emit(event, data);
    } catch (error) {
      console.error(`Error emitting event ${event}:`, error);
    }
  }

  /**
   * Get event statistics
   */
  getStats() {
    return {
      eventNames: this.eventNames(),
      maxListeners: this.getMaxListeners(),
      listenerCounts: this.eventNames().map(event => ({
        event,
        listenerCount: this.listenerCount(event)
      }))
    };
  }

  /**
   * Remove all listeners for cleanup
   */
  cleanup() {
    this.removeAllListeners();
  }
}

// Singleton instance
const socketEventEmitter = new SocketEventEmitter();

module.exports = socketEventEmitter;
