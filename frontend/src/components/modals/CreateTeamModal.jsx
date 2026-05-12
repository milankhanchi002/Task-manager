import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Users, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

const teamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100, 'Team name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

export const CreateTeamModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/teams', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onClose();
      reset();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} />
            Create New Team
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <form id="team-form" onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name</label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                placeholder="Marketing Team"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
              <textarea
                {...register('description')}
                rows="4"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm resize-none"
                placeholder="What is this team responsible for?"
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>
            
            {mutation.isError && (
               <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                 {mutation.error?.response?.data?.message || 'An error occurred while creating the team.'}
               </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="space-y-1">
                    <li>• You'll be automatically added as the team owner</li>
                    <li>• You can invite members to join your team</li>
                    <li>• Teams help organize projects and tasks better</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-5 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="team-form"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-70"
          >
            {mutation.isPending ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
};
