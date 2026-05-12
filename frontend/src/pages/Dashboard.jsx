import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, FolderGit2, AlertCircle, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { TaskModal } from '../components/modals/TaskModal';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    }
  });

  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data;
    }
  });

  if (isLoadingProjects || isLoadingTasks) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'Completed') return false;
    return new Date(t.dueDate) < new Date();
  });
  const myTasks = tasks.filter(t => 
    t.assignedTo?._id === user?._id || 
    t.assignedTo === user?._id || 
    t.createdBy?._id === user?._id || 
    t.createdBy === user?._id
  );

  const stats = [
    { name: 'Total Projects', value: totalProjects, icon: FolderGit2, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', trend: '+12%', trendUp: true },
    { name: 'Total Tasks', value: totalTasks, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', trend: '+5%', trendUp: true },
    { name: 'Completion Rate', value: totalTasks ? Math.round((completedTasks / totalTasks) * 100) + '%' : '0%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', trend: '+2%', trendUp: true },
    { name: 'Overdue Tasks', value: overdueTasks.length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', trend: overdueTasks.length > 0 ? 'Action Needed' : 'On Track', trendUp: overdueTasks.length === 0 },
  ];

  const statusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'To Do').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'In Review', value: tasks.filter(t => t.status === 'In Review').length },
    { name: 'Completed', value: completedTasks },
  ].filter(d => d.value > 0);

  const finalStatusData = statusData.length > 0 ? statusData : [
    { name: 'To Do', value: 5 }, { name: 'In Progress', value: 8 }, { name: 'Completed', value: 12 }
  ];

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

  const dynamicActivityData = last7Days.map(dayLabel => {
    const count = tasks.filter(t => {
      const taskDate = new Date(t.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      return taskDate === dayLabel;
    }).length;
    return { name: dayLabel, tasks: count };
  });

  const totalRecentTasks = dynamicActivityData.reduce((acc, curr) => acc + curr.tasks, 0);
  const activityData = totalRecentTasks > 0 ? dynamicActivityData : [
    { name: 'Mon', tasks: 4 }, { name: 'Tue', tasks: 3 }, { name: 'Wed', tasks: 7 },
    { name: 'Thu', tasks: 5 }, { name: 'Fri', tasks: 8 }, { name: 'Sat', tasks: 2 }, { name: 'Sun', tasks: 6 }
  ];

  const openNewTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here is what’s happening with your projects today.</p>
        </div>
        <button 
          onClick={openNewTask}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-primary-600/20"
        >
          + New Task
        </button>
      </div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <motion.div key={stat.name} variants={itemVariants} className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={22} /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.trendUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {stat.trend}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">vs last week</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Task Creation Activity</h2>
            <select className="bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 text-sm rounded-lg px-3 py-1.5 outline-none dark:text-gray-300">
              <option>Last 7 days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }}/>
                <Area type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tasks by Status</h2>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={finalStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {finalStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }}/>
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Lists Section */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Tasks</h2>
            <Link to="/tasks" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="p-2 flex-1">
            {myTasks.length > 0 ? (
              <div className="space-y-1">
                {myTasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors cursor-pointer" onClick={() => openEditTask(task)}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${task.status === 'Completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-100 text-gray-500 dark:bg-dark-600'}`}>
                        {task.status === 'Completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === 'Completed' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span className="truncate max-w-[120px]">{task.project?.title || 'General'}</span>
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-red-500"><Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-gray-400 mb-3"><CheckCircle2 size={24} /></div>
                <p className="text-gray-900 dark:text-white font-medium">No tasks assigned</p>
                <p className="text-sm text-gray-500 mt-1">You're all caught up! Enjoy your day.</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle size={18} /> Overdue Tasks
            </h2>
          </div>
          <div className="p-2 flex-1">
            {overdueTasks.length > 0 ? (
              <div className="space-y-1">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                      <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => openEditTask(task)} className="flex-shrink-0 text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                      Action
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 mb-3"><CheckCircle2 size={24} /></div>
                <p className="text-gray-900 dark:text-white font-medium">No overdue tasks</p>
                <p className="text-sm text-gray-500 mt-1">Great job keeping everything on schedule.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        initialData={taskToEdit} 
      />
    </div>
  );
};

export default Dashboard;
