import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Bell, LogOut, Search } from 'lucide-react';
import NotificationDropdown from './ui/NotificationDropdown';

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks, projects..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-dark-800 rounded-lg outline-none transition-all dark:text-gray-200 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <NotificationDropdown />

        <div className="h-8 w-px bg-gray-200 dark:bg-dark-700 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role || 'Member'}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button 
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors ml-1"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
