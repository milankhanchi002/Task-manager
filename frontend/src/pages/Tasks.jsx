import { useState } from 'react';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { TaskModal } from '../components/modals/TaskModal';

const Tasks = () => {
  const queryClient = useQueryClient();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data;
    }
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }) => {
      return await api.put(`/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleTaskMove = (taskId, newStatus) => {
    updateTaskStatus.mutate({ taskId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tasks = data?.data || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks Board</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your tasks across different stages.</p>
        </div>
        <button 
          onClick={() => setIsTaskModalOpen(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-primary-600/20"
        >
          + New Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <KanbanBoard initialTasks={tasks} onTaskStatusChange={handleTaskMove} />
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        initialData={null} 
      />
    </div>
  );
};

export default Tasks;
