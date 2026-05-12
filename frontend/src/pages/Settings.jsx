import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Mail, 
  Lock,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Settings = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors, isSubmitting: isProfileSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onProfileSubmit = async (data) => {
    try {
      setProfileMessage('');
      console.log('Profile updated:', data);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setPasswordMessage('');
      console.log('Password updated');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      resetPassword();
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Failed to update password' });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:w-64">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                <tab.icon size={18} className="flex-shrink-0" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex-1">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Information</h2>
                  <p className="text-gray-500 dark:text-gray-400">Update your account profile information</p>
                </div>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input
                      {...registerProfile('name')}
                      type="text"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                      placeholder="John Doe"
                    />
                    {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                      {...registerProfile('email')}
                      type="email"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                      placeholder="john@company.com"
                    />
                    {profileErrors.email && <p className="mt-1 text-xs text-red-500">{profileErrors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <input
                      type="text"
                      value={user?.role || 'user'}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg text-sm text-gray-500 dark:text-gray-400"
                    />
                  </div>

                  {profileMessage && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                      profileMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {profileMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {profileMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProfileSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
                  >
                    <Save size={16} />
                    {isProfileSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Security Settings</h2>
                  <p className="text-gray-500 dark:text-gray-400">Manage your password and security preferences</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        {...registerPassword('currentPassword')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && <p className="mt-1 text-xs text-red-500">{passwordErrors.currentPassword.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        {...registerPassword('newPassword')}
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && <p className="mt-1 text-xs text-red-500">{passwordErrors.newPassword.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        {...registerPassword('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>}
                  </div>

                  {passwordMessage && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                      passwordMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {passwordMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {passwordMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
                  >
                    <Lock size={16} />
                    {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <div className="pt-6 border-t border-gray-200 dark:border-dark-700">
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <AlertCircle size={16} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Notification Preferences</h2>
                  <p className="text-gray-500 dark:text-gray-400">Manage how you receive notifications</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates about your tasks and projects</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Task Assignments</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when you're assigned to a task</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Project Updates</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Stay updated on project changes and milestones</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Weekly Summary</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly digest of your activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Appearance</h2>
                  <p className="text-gray-500 dark:text-gray-400">Customize the look and feel of your application</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isDark}
                        onChange={toggleTheme}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Language</h3>
                    <select className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Time Zone</h3>
                    <select className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm">
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time (EST)</option>
                      <option value="PST">Pacific Time (PST)</option>
                      <option value="GMT">Greenwich Mean Time (GMT)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
