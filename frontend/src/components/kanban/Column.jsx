import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { useDroppable } from '@dnd-kit/core';

export const Column = ({ column, tasks }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-dark-900/50 rounded-2xl w-80 flex-shrink-0 border border-gray-100 dark:border-dark-700">
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900 dark:text-white">{column.title}</h2>
          <span className="bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-grow p-3 overflow-y-auto h-[calc(100vh-280px)]" ref={setNodeRef}>
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 min-h-[150px]">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};
