import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const AuthLayout = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 p-4 transition-colors duration-200">
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-800 text-gray-500 transition-colors"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">Ethara Task</h1>
          <p className="text-gray-500 dark:text-gray-400">Streamline your team's workflow</p>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
