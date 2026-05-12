import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

const COLUMNS = [
  { id: 'To Do', title: 'To Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'In Review', title: 'In Review' },
  { id: 'Completed', title: 'Completed' },
];

export const KanbanBoard = ({ initialTasks, onTaskStatusChange }) => {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const columnsId = useMemo(() => COLUMNS.map((col) => col.id), []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event) => {
    const { active } = event;
    const { data } = active;

    if (data.current?.type === 'Task') {
      setActiveTask(data.current.task);
    }
  };

  const onDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t._id === activeId);
        const overIndex = tasks.findIndex((t) => t._id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status;
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t._id === activeId);
        tasks[activeIndex].status = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    
    const taskIndex = tasks.findIndex(t => t._id === activeId);
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      const originalTask = initialTasks.find(t => t._id === activeId);
      
      if (originalTask && originalTask.status !== task.status) {
        onTaskStatusChange(task._id, task.status);
      }
    }
  };

  return (
    <div className="flex h-full w-full overflow-x-auto overflow-y-hidden pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 h-full items-start">
          {COLUMNS.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={tasks.filter((task) => task.status === column.id)}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
