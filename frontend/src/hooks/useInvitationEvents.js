import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';

export const useInvitationEvents = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const handleInvitationEvent = useCallback((event) => {
    const handler = (e) => {
      const { event: eventType, data } = e.detail;
      
      if (eventType === event) {
        console.log(`Handling invitation event: ${eventType}`, data);
        
        // Invalidate relevant queries based on event type
        switch (eventType) {
          case 'invitation:sent':
            // Update sender's sent invitations and receiver's notifications
            queryClient.invalidateQueries({ queryKey: ['invitations', 'sent'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            break;
            
          case 'invitation:accepted':
            // Update both sender and receiver
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            break;
            
          case 'invitation:rejected':
            // Update both sender and receiver
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            break;
            
          case 'invitation:cancelled':
            // Update receiver
            queryClient.invalidateQueries({ queryKey: ['invitations', 'received'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            break;
        }
      }
    };

    // Add and remove event listeners
    window.addEventListener('invitation-event', handler);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('invitation-event', handler);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!socket) return;

    // Set up event listeners for invitation events
    const cleanupSent = handleInvitationEvent('invitation:sent');
    const cleanupAccepted = handleInvitationEvent('invitation:accepted');
    const cleanupRejected = handleInvitationEvent('invitation:rejected');
    const cleanupCancelled = handleInvitationEvent('invitation:cancelled');

    // Cleanup on unmount
    return () => {
      cleanupSent();
      cleanupAccepted();
      cleanupRejected();
      cleanupCancelled();
    };
  }, [socket, handleInvitationEvent]);

  return {
    isConnected: socket?.connected || false
  };
};
