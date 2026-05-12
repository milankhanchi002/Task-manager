import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ProjectModal } from '../components/modals/ProjectModal';
import { FolderGit2, Plus, Users, Calendar, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    }
  });

  const openNewProject = () => {
    setProjectToEdit(null);
    setIsModalOpen(true);
  };

  const openEditProject = (project) => {
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const projects = data?.data || [];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team's projects and track progress.</p>
        </div>
        <button 
          onClick={openNewProject}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-primary-600/20"
        >
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 mb-4">
            <FolderGit2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No projects yet</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">Create your first project to start organizing tasks, collaborating with your team, and tracking your goals.</p>
          <button 
            onClick={openNewProject}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={project._id} 
              className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 shadow-sm hover:shadow-md transition-shadow group relative"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditProject(project)}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-primary-600">
                  <FolderGit2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {project.title}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1
                    ${project.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                      project.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
                  `}>
                    <span className="capitalize">{project.status}</span>
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 min-h-[40px]">
                {project.description}
              </p>

              <div className="pt-4 border-t border-gray-100 dark:border-dark-700 flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Users size={16} />
                  <span>{project.members?.length || 1} members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  <span>{new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={projectToEdit} 
      />
    </div>
  );
};

export default Projects;
