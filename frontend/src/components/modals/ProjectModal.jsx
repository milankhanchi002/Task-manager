import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  status: z.enum(['active', 'completed', 'on-hold']),
});

export const ProjectModal = ({ isOpen, onClose, initialData = null }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'active'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          title: initialData.title,
          description: initialData.description,
          status: initialData.status
        });
      } else {
        reset({
          title: '',
          description: '',
          status: 'active'
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (initialData) {
        return await api.put(`/projects/${initialData._id}`, data);
      } else {
        return await api.post('/projects', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <form id="project-form" onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Title</label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                placeholder="Website Redesign"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows="4"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm resize-none"
                placeholder="What is this project about?"
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
              {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>}
            </div>
            
            {mutation.isError && (
               <p className="text-sm text-red-500">{mutation.error?.response?.data?.message || 'An error occurred'}</p>
            )}
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
            form="project-form"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-70"
          >
            {mutation.isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
