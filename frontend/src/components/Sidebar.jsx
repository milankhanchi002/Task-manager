import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, CheckSquare, FolderGit2, Menu, X, Users, Settings, MailOpen } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderGit2 },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Invitations', path: '/invitations', icon: MailOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <motion.div
      animate={{ width: isOpen ? '240px' : '72px' }}
      className="h-screen bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 flex flex-col relative transition-all duration-300 z-20"
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-dark-700">
        {isOpen && (
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="font-bold text-lg text-primary-600 dark:text-primary-400"
          >
            Ethara Task
          </motion.span>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-2 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
              ${isActive 
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'}
            `}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {isOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </motion.div>
  );
};

export default Sidebar;
