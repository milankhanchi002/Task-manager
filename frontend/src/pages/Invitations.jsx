import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  MailOpen, 
  Mail, 
  Users, 
  Calendar, 
  Check, 
  X, 
  Loader2, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  X as CloseIcon
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/ui/Toast';
import { useInvitationEvents } from '../hooks/useInvitationEvents';

const Invitations = () => {
  const [activeTab, setActiveTab] = useState('received');
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { isConnected } = useInvitationEvents();

  // Fetch received invitations
  const { data: receivedInvitationsData, isLoading: isLoadingReceived } = useQuery({
    queryKey: ['invitations', 'received'],
    queryFn: async () => {
      const res = await api.get('/invitations/my');
      return res.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch sent invitations
  const { data: sentInvitationsData, isLoading: isLoadingSent } = useQuery({
    queryKey: ['invitations', 'sent'],
    queryFn: async () => {
      const res = await api.get('/invitations/sent');
      return res.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId) => {
      return await api.put(`/invitations/${invitationId}/accept`);
    },
    onSuccess: (data, invitationId) => {
      success('Invitation accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to accept invitation';
      error(errorMessage);
    }
  });

  // Reject invitation mutation
  const rejectInvitationMutation = useMutation({
    mutationFn: async (invitationId) => {
      return await api.put(`/invitations/${invitationId}/reject`);
    },
    onSuccess: () => {
      success('Invitation rejected');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to reject invitation';
      error(errorMessage);
    }
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId) => {
      return await api.put(`/invitations/${invitationId}/cancel`);
    },
    onSuccess: () => {
      success('Invitation cancelled');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to cancel invitation';
      error(errorMessage);
    }
  });

  const receivedInvitations = receivedInvitationsData?.data || [];
  const sentInvitations = sentInvitationsData?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'accepted':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'expired':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const isLoading = activeTab === 'received' ? isLoadingReceived : isLoadingSent;
  const invitations = activeTab === 'received' ? receivedInvitations : sentInvitations;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invitations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team and project invitations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'received'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <MailOpen size={16} />
              Received
              {receivedInvitations.length > 0 && (
                <span className="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs font-medium">
                  {receivedInvitations.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'sent'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail size={16} />
              Sent
              {sentInvitations.length > 0 && (
                <span className="bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs font-medium">
                  {sentInvitations.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && invitations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-12 text-center"
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center text-gray-400 mb-4 mx-auto">
            {activeTab === 'received' ? <MailOpen size={32} /> : <Mail size={32} />}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {activeTab === 'received' ? 'No invitations received' : 'No invitations sent'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {activeTab === 'received' 
              ? 'You don\'t have any pending invitations. Check back later or ask team members to invite you.'
              : 'You haven\'t sent any invitations yet. Start by inviting team members to collaborate.'
            }
          </p>
        </motion.div>
      )}

      {/* Invitations List */}
      {!isLoading && invitations.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {invitations.map((invitation, index) => (
            <motion.div
              key={invitation._id}
              variants={itemVariants}
              className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                    {activeTab === 'received' 
                      ? getInitials(invitation.sender?.name || 'Unknown')
                      : getInitials(invitation.receiver?.name || 'Unknown')
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {activeTab === 'received' 
                          ? `Invitation from ${invitation.sender?.name || 'Unknown'}`
                          : `Invitation to ${invitation.receiver?.name || 'Unknown'}`
                        }
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(invitation.status)}
                          <span className="capitalize">{invitation.status}</span>
                        </div>
                      </span>
                    </div>

                    {/* Invitation Details */}
                    <div className="space-y-2">
                      {invitation.project && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar size={14} />
                          <span>Project: {invitation.project.title}</span>
                        </div>
                      )}
                      
                      {invitation.team && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users size={14} />
                          <span>Team: {invitation.team.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <UserPlus size={14} />
                        <span>Role: <span className="font-medium capitalize">{invitation.role}</span></span>
                      </div>

                      {invitation.message && (
                        <div className="bg-gray-50 dark:bg-dark-900 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                          <p className="italic">"{invitation.message}"</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Sent {new Date(invitation.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {activeTab === 'received' && invitation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => acceptInvitationMutation.mutate(invitation._id)}
                        disabled={acceptInvitationMutation.isPending}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {acceptInvitationMutation.isPending ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          <>
                            <Check size={16} className="mr-1" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => rejectInvitationMutation.mutate(invitation._id)}
                        disabled={rejectInvitationMutation.isPending}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rejectInvitationMutation.isPending ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          <>
                            <X size={16} className="mr-1" />
                            Reject
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {activeTab === 'sent' && invitation.status === 'pending' && (
                    <button
                      onClick={() => cancelInvitationMutation.mutate(invitation._id)}
                      disabled={cancelInvitationMutation.isPending}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelInvitationMutation.isPending ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <>
                          <CloseIcon size={16} className="mr-1" />
                          Cancel
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Invitations;
