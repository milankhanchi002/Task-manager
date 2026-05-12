import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  status: z.enum(['To Do', 'In Progress', 'In Review', 'Completed']),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  project: z.string().min(1, 'Project selection is required'),
  dueDate: z.string().optional(),
});

export const TaskModal = ({ isOpen, onClose, initialData = null }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'To Do',
      priority: 'Medium',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          ...initialData,
          project: initialData.project?._id || initialData.project,
          dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
        });
      } else {
        reset({
          title: '',
          description: '',
          status: 'To Do',
          priority: 'Medium',
          project: '',
          dueDate: ''
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (!payload.dueDate) delete payload.dueDate;

      if (initialData) {
        return await api.put(`/tasks/${initialData._id}`, payload);
      } else {
        return await api.post('/tasks', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    }
  });

  if (!isOpen) return null;

  const projects = projectsData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1">
          <form id="task-form" onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title</label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                placeholder="Design the new landing page"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows="3"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm resize-none"
                placeholder="Include details, links, or specific requirements..."
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
              <select
                {...register('project')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                disabled={isLoadingProjects}
              >
                <option value="">Select a project</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
              {errors.project && <p className="mt-1 text-xs text-red-500">{errors.project.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                </select>
                {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                {errors.priority && <p className="mt-1 text-xs text-red-500">{errors.priority.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input
                {...register('dueDate')}
                type="date"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none transition-all dark:text-white text-sm"
              />
            </div>
            
            {mutation.isError && (
               <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                 {mutation.error?.response?.data?.message || 
                  (mutation.error?.response?.data?.errors && mutation.error.response.data.errors[0]?.msg) || 
                  'An error occurred while saving the task.'}
               </div>
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
            form="task-form"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-70"
          >
            {mutation.isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};
