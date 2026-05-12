import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X, UserPlus, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from './Toast';
import { useInvitationEvents } from '../../hooks/useInvitationEvents';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const { isConnected } = useInvitationEvents();

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      return await api.put(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await api.put('/notifications/mark-all-read');
    },
    onSuccess: () => {
      success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: () => {
      error('Failed to mark all as read');
    }
  });

  // Handle invitation response
  const handleInvitationResponse = useMutation({
    mutationFn: async ({ invitationId, action }) => {
      return await api.put(`/invitations/${invitationId}/${action}`);
    },
    onSuccess: (_, variables) => {
      success(`Invitation ${variables.action}d successfully!`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || `Failed to ${variables.action} invitation`;
      error(errorMessage);
    }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'invitation_sent':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'invitation_accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invitation_rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'team_joined':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'project_created':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (isRead) => {
    return isRead 
      ? 'bg-white dark:bg-dark-800 border-gray-100 dark:border-dark-700' 
      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData?.data?.count || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-dark-800 font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-dark-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 ${getNotificationColor(notification.isRead)} transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>

                        {/* Invitation Actions */}
                        {notification.type === 'invitation_sent' && !notification.isRead && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleInvitationResponse.mutate({
                                invitationId: notification.relatedId,
                                action: 'accept'
                              })}
                              disabled={handleInvitationResponse.isPending}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleInvitationResponse.mutate({
                                invitationId: notification.relatedId,
                                action: 'reject'
                              })}
                              disabled={handleInvitationResponse.isPending}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Mark as read button */}
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification._id)}
                          disabled={markAsReadMutation.isPending}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
