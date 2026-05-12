import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Mail, 
  Crown, 
  Shield, 
  User, 
  MoreVertical, 
  Trash2,
  UserPlus,
  Search,
  Filter
} from 'lucide-react';
import { InviteMemberModal } from '../components/modals/InviteMemberModal';
import { InvitationSearchModal } from '../components/modals/InvitationSearchModal';
import { CreateTeamModal } from '../components/modals/CreateTeamModal';
import { useAuth } from '../context/AuthContext';

const Team = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInvitationSearchModalOpen, setIsInvitationSearchModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [selectedTeamForInvitation, setSelectedTeamForInvitation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users/invite-candidates');
      return res.data;
    }
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data;
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await api.delete(`/auth/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      return await api.put(`/auth/users/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const users = usersData?.data || [];
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-red-500" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'manager':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const canManageUser = (user) => {
    return currentUser?.role === 'admin' || 
           (currentUser?.role === 'manager' && user.role !== 'admin');
  };

  const canInviteToTeam = (team) => {
    console.log('Debug canInviteToTeam:', {
      team: team._id,
      teamOwner: team.owner?._id,
      currentUser: currentUser?._id,
      currentUserRole: currentUser?.role,
      isOwner: team.owner?._id === currentUser._id,
      isMember: team.members?.some(member => member.user === currentUser._id),
      isAdminOrManager: currentUser.role === 'admin' || currentUser.role === 'manager'
    });
    
    if (!currentUser) return false;
    const isOwner = team.owner?._id === currentUser._id;
    const isMember = team.members?.some(member => member.user === currentUser._id);
    const isAdminOrManager = currentUser.role === 'admin' || currentUser.role === 'manager';
    const canInvite = isOwner || (isMember && isAdminOrManager);
    
    console.log('canInvite result:', canInvite, 'for team:', team.name);
    return canInvite;
  };

  const handleTeamInvitation = (team) => {
    setSelectedTeamForInvitation(team);
    setIsInvitationSearchModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team members and their roles</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCreateTeamModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-green-600/20"
          >
            <Plus size={18} />
            <span>Create Team</span>
          </button>
          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
            <>
              <button 
                onClick={() => setIsInvitationSearchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-primary-600/20"
              >
                <UserPlus size={18} />
                <span>Invite Existing</span>
              </button>
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-green-600/20"
              >
                <Mail size={18} />
                <span>Create New</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{users.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/20 text-primary-600">
              <Users size={22} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Admins</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600">
              <Crown size={22} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Managers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {users.filter(u => u.role === 'manager').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <Shield size={22} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Teams Section */}
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Teams</h2>
          <button 
            onClick={() => setIsCreateTeamModalOpen(true)}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <Plus size={16} />
            Create New Team
          </button>
        </div>
        
        {teamsData?.data && teamsData.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamsData.data.map((team) => (
              <motion.div
                key={team._id}
                variants={itemVariants}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-4 shadow-sm hover:shadow-md transition-shadow group relative"
              >
                {canInviteToTeam(team) && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleTeamInvitation(team)}
                      className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors"
                      title="Invite Member"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                    {team.members?.length || 1} members
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{team.name}</h3>
                {team.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{team.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Owner: {team.owner?.name}</span>
                  <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center text-gray-400 mb-3 mx-auto">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No teams yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first team to start collaborating with others</p>
            <button 
              onClick={() => setIsCreateTeamModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus size={16} />
              Create Team
            </button>
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:bg-white dark:focus:bg-dark-800 rounded-lg outline-none transition-all dark:text-gray-200 text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:bg-white dark:focus:bg-dark-800 rounded-lg outline-none transition-all dark:text-gray-200 text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="manager">Managers</option>
            <option value="user">Users</option>
          </select>
        </div>
      </div>

      {/* Team Members Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user._id}
            variants={itemVariants}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 shadow-sm hover:shadow-md transition-shadow group relative"
          >
            {canManageUser(user) && user._id !== currentUser?._id && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                  <button className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-8 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                      onClick={() => updateRoleMutation.mutate({ userId: user._id, role: 'admin' })}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 flex items-center gap-2"
                      disabled={updateRoleMutation.isPending}
                    >
                      <Crown size={14} /> Make Admin
                    </button>
                    <button
                      onClick={() => updateRoleMutation.mutate({ userId: user._id, role: 'manager' })}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 flex items-center gap-2"
                      disabled={updateRoleMutation.isPending}
                    >
                      <Shield size={14} /> Make Manager
                    </button>
                    <button
                      onClick={() => updateRoleMutation.mutate({ userId: user._id, role: 'user' })}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 flex items-center gap-2"
                      disabled={updateRoleMutation.isPending}
                    >
                      <User size={14} /> Make User
                    </button>
                    <div className="border-t border-gray-200 dark:border-dark-700 my-1"></div>
                    <button
                      onClick={() => removeUserMutation.mutate(user._id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      disabled={removeUserMutation.isPending}
                    >
                      <Trash2 size={14} /> Remove User
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                {getInitials(user.name)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">{user.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                {getRoleIcon(user.role)}
                <span className="capitalize">{user.role}</span>
              </div>
              {user._id === currentUser?._id && (
                <span className="text-xs text-gray-500 dark:text-gray-400">You</span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                <span>{user.email}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredUsers.length === 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No team members found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || roleFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Start by inviting team members to collaborate'
            }
          </p>
        </div>
      )}

      <InviteMemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />
      
      <InvitationSearchModal 
        isOpen={isInvitationSearchModalOpen} 
        onClose={() => {
          setIsInvitationSearchModalOpen(false);
          setSelectedTeamForInvitation(null);
        }}
        teamId={selectedTeamForInvitation?._id}
      />
      
      <CreateTeamModal 
        isOpen={isCreateTeamModalOpen} 
        onClose={() => setIsCreateTeamModalOpen(false)} 
      />
    </div>
  );
};

export default Team;
