import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, AlertCircle, FolderGit2 } from 'lucide-react';

export const TaskCard = ({ task }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 rounded-xl h-32 opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 cursor-grab active:cursor-grabbing hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
          ${task.priority === 'High' || task.priority === 'Urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
            task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}
        `}>
          {task.priority}
        </span>
        
        {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed' && (
          <AlertCircle size={14} className="text-red-500" />
        )}
      </div>
      
      <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">{task.title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{task.description}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <FolderGit2 size={12} />
          <span className="truncate max-w-[80px]">{task.project?.title || 'General'}</span>
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
};
