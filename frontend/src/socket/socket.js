import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connectionManager = null;
  }

  // Initialize socket connection
  connect(authData) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    if (!authData || !authData.user) {
      console.log('Cannot connect socket: No auth data provided');
      return;
    }

    // Get socket URL based on environment
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.DEV ? 'http://localhost:5001' : window.location.origin);

    console.log('Connecting to socket:', socketUrl);

    this.socket = io(socketUrl, {
      withCredentials: true, // Send cookies for authentication
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.connectionManager = null;
    }
  }

  // Setup socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      // Authentication is handled via cookies with withCredentials: true
    });

    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
      this.connectionManager = data;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Invitation events
    this.socket.on('invitation:sent', (data) => {
      console.log('Invitation sent event received:', data);
      this.handleInvitationEvent('invitation:sent', data);
    });

    this.socket.on('invitation:accepted', (data) => {
      console.log('Invitation accepted event received:', data);
      this.handleInvitationEvent('invitation:accepted', data);
    });

    this.socket.on('invitation:rejected', (data) => {
      console.log('Invitation rejected event received:', data);
      this.handleInvitationEvent('invitation:rejected', data);
    });

    this.socket.on('invitation:cancelled', (data) => {
      console.log('Invitation cancelled event received:', data);
      this.handleInvitationEvent('invitation:cancelled', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      console.log('New notification event received:', data);
      this.handleNotificationEvent('notification:new', data);
    });

    this.socket.on('notification:read', (data) => {
      console.log('Notification read event received:', data);
      this.handleNotificationEvent('notification:read', data);
    });

    this.socket.on('notification:count:update', (data) => {
      console.log('Notification count update event received:', data);
      this.handleNotificationEvent('notification:count:update', data);
    });

    // Team events
    this.socket.on('team:member:joined', (data) => {
      console.log('Team member joined event received:', data);
      this.handleTeamEvent('team:member:joined', data);
    });

    this.socket.on('team:member:left', (data) => {
      console.log('Team member left event received:', data);
      this.handleTeamEvent('team:member:left', data);
    });

    // Project events
    this.socket.on('project:member:added', (data) => {
      console.log('Project member added event received:', data);
      this.handleProjectEvent('project:member:added', data);
    });

    this.socket.on('project:member:removed', (data) => {
      console.log('Project member removed event received:', data);
      this.handleProjectEvent('project:member:removed', data);
    });
  }

  // Handle invitation events
  handleInvitationEvent(event, data) {
    // Dispatch custom event for React components to listen
    window.dispatchEvent(new CustomEvent('invitation-event', {
      detail: { event, data }
    }));
  }

  // Handle notification events
  handleNotificationEvent(event, data) {
    // Dispatch custom event for React components to listen
    window.dispatchEvent(new CustomEvent('notification-event', {
      detail: { event, data }
    }));
  }

  // Handle team events
  handleTeamEvent(event, data) {
    // Dispatch custom event for React components to listen
    window.dispatchEvent(new CustomEvent('team-event', {
      detail: { event, data }
    }));
  }

  // Handle project events
  handleProjectEvent(event, data) {
    // Dispatch custom event for React components to listen
    window.dispatchEvent(new CustomEvent('project-event', {
      detail: { event, data }
    }));
  }

  // Get socket connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Join room
  joinRoom(roomName) {
    if (this.socket?.connected) {
      this.socket.emit('join-room', { room: roomName });
    }
  }

  // Leave room
  leaveRoom(roomName) {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', { room: roomName });
    }
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
