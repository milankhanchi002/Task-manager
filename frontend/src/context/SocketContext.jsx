import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../socket/socket';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionManager, setConnectionManager] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if we have auth data and user is properly loaded
    if (!user || !user._id) {
      console.log('SocketProvider: No auth data available');
      return;
    }

    // Connect socket with auth data (cookie-based)
    socketService.connect({
      user
    });

    // Listen for connection updates
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Socket connected in context');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected in context');
    };

    const handleAuthenticated = (data) => {
      setConnectionManager(data);
    };

    // Add event listeners for connection status
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('authenticated', handleAuthenticated);
    }

    // Cleanup on unmount
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('authenticated', handleAuthenticated);
      }
      socketService.disconnect();
    };
  }, [user]);

  // Handle logout
  useEffect(() => {
    if (!user || !user._id) {
      socketService.disconnect();
      setIsConnected(false);
      setConnectionManager(null);
    }
  }, [user]);

  const value = {
    socket: socketService.getSocket(),
    isConnected,
    connectionManager,
    socketService
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
