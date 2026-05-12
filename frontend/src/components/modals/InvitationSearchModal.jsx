import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Search, UserPlus, Loader2, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useToast } from '../ui/Toast';

const invitationSchema = z.object({
  receiver: z.string().min(1, 'Please select a user'),
  project: z.string().optional(),
  team: z.string().optional(),
  role: z.enum(['member', 'admin']).default('member'),
  message: z.string().max(500, 'Message too long').optional(),
});

export const InvitationSearchModal = ({ isOpen, onClose, projectId = null, teamId = null }) => {
  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      receiver: '',
      project: projectId || '',
      team: teamId || '',
      role: 'member',
      message: ''
    }
  });

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Set project/team values when props change
  useEffect(() => {
    if (projectId) setValue('project', projectId);
    if (teamId) setValue('team', teamId);
  }, [projectId, teamId, setValue]);

  // Search users query
  const { data: searchResults, isLoading: isSearching, refetch: searchUsers } = useQuery({
    queryKey: ['invite-candidates', searchQuery, teamId, projectId],
    queryFn: async () => {
      if (searchQuery.length < 2) return { data: [] };
      const params = new URLSearchParams({ q: searchQuery });
      if (teamId) params.append('teamId', teamId);
      if (projectId) params.append('projectId', projectId);
      const res = await api.get(`/users/invite-candidates?${params.toString()}`);
      return res.data;
    },
    enabled: searchQuery.length >= 2,
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/invitations/send', data);
    },
    onSuccess: () => {
      success('Invitation sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['invite-candidates'] });
      onClose();
      reset();
      setSelectedUser(null);
      setSearchQuery('');
    },
    onError: (error) => {
      console.log('INVITATION ERROR:', error?.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to send invitation';
      showError(errorMessage);
    }
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setValue('receiver', user._id);
    setSearchQuery(user.name);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (selectedUser && value !== selectedUser.name) {
      setSelectedUser(null);
      setValue('receiver', '');
    }
  };

  const onSubmit = (data) => {
    console.log('SELECTED USER:', selectedUser);
    console.log('SELECTED ROLE:', data.role);
    
    if (!selectedUser) {
      return;
    }
    
    const payload = {
      receiver: selectedUser._id,
      team: teamId,
      project: projectId,
      role: data.role,
      message: data.message
    };
    
    console.log('INVITATION PAYLOAD:', payload);
    sendInvitationMutation.mutate(payload);
  };

  const handleClose = () => {
    if (!sendInvitationMutation.isPending) {
      onClose();
      reset();
      setSelectedUser(null);
      setSearchQuery('');
    }
  };

  if (!isOpen) return null;

  const users = searchResults?.data || [];
  const showDropdown = searchQuery.length >= 2 && (isSearching || users.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus size={20} />
            Invite to {projectId ? 'Project' : 'Team'}
          </h2>
          <button 
            onClick={handleClose}
            disabled={sendInvitationMutation.isPending}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto">
          <form id="invitation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* User Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:bg-white dark:focus:bg-dark-800 rounded-lg outline-none transition-all dark:text-white text-sm"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={18} />
                )}
              </div>

              {/* Search Results Dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                      Searching...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      <Users size={20} className="mx-auto mb-2 opacity-50" />
                      No users found
                    </div>
                  ) : (
                    users.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors border-b border-gray-100 dark:border-dark-700 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected User Display */}
            {selectedUser && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedUser.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden receiver field */}
            <input type="hidden" {...register('receiver')} />
            <input type="hidden" {...register('project')} />
            <input type="hidden" {...register('team')} />

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message (Optional)
              </label>
              <textarea
                {...register('message')}
                rows="3"
                placeholder="Add a personal message..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm resize-none"
              />
              {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
            </div>
            
            {sendInvitationMutation.isError && (
               <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                 {sendInvitationMutation.error?.response?.data?.message || 'Failed to send invitation'}
               </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Invitation details:</p>
                  <ul className="space-y-1">
                    <li>• User will receive an invitation notification</li>
                    <li>• They can accept or reject the invitation</li>
                    <li>• Upon acceptance, they'll join the {projectId ? 'project' : 'team'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-5 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={sendInvitationMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="invitation-form"
            disabled={!selectedUser || sendInvitationMutation.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {sendInvitationMutation.isPending ? (
              <>
                <Loader2 size={16} className="inline mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus size={16} className="inline mr-2" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
