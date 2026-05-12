import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Welcome back</h2>
      
      {error && (
        <div className="p-3 mb-6 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white"
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white"
            placeholder="••••••••"
          />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 mt-2"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
