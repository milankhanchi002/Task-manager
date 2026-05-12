# Task Manager - Full Stack Application

A comprehensive task management application built with MERN stack, featuring team collaboration, project management, and Kanban board functionality.

## 🚀 Features

### Core Functionality
- **📊 Dashboard**: Statistics, charts, and task overview
- **📋 Projects**: Create, manage, and organize projects
- **📝 Tasks**: Kanban board with drag-and-drop functionality
- **👥 Teams**: Create teams, invite members, manage roles
- **⚙️ Settings**: User preferences, profile management

### Advanced Features
- **🔐 Authentication**: JWT-based login/register with role-based access
- **🎨 Dark Mode**: Complete theme switching support
- **📱 Responsive Design**: Mobile-first responsive UI
- **🔄 Real-time Updates**: React Query for data synchronization
- **🛡️ Security**: Role-based permissions and authorization

### Task Management
- **Kanban Board**: Drag-and-drop task management
- **Task Statuses**: To Do, In Progress, In Review, Completed
- **Priority Levels**: Low, Medium, High, Urgent
- **Due Dates**: Task scheduling and overdue tracking
- **Search & Filter**: Advanced task filtering

### Project Management
- **Project Creation**: Full CRUD operations
- **Member Management**: Add/remove team members
- **Project Statuses**: Active, Completed, On Hold
- **Task Assignment**: Assign tasks to team members

### Team Collaboration
- **Team Creation**: Create and manage teams
- **Role Management**: Admin, Manager, User roles
- **Member Invitation**: Email-based user invitations
- **Permission Control**: Granular access management

## 🛠️ Tech Stack

### Frontend
- **React 19**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **TailwindCSS**: Utility-first CSS framework
- **React Query**: Server state management and caching
- **React Router v7**: Client-side routing
- **Framer Motion**: Smooth animations and transitions
- **@dnd-kit**: Drag-and-drop functionality
- **React Hook Form**: Forms with validation
- **Zod**: TypeScript-first schema validation
- **Lucide React**: Beautiful icon library

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: Authentication and authorization
- **bcryptjs**: Password hashing
- **dotenv**: Environment variable management
- **Morgan**: HTTP request logger
- **Helmet**: Security headers

## 📁 Project Structure

```
task-manager/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── teamController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── Team.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── teamRoutes.js
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── projectValidator.js
│   │   ├── taskValidator.js
│   │   └── teamValidator.js
│   ├── utils/
│   │   └── jwt.js
│   ├── config/
│   │   └── db.js
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── kanban/
    │   │   │   ├── KanbanBoard.jsx
    │   │   │   ├── Column.jsx
    │   │   │   └── TaskCard.jsx
    │   │   ├── modals/
    │   │   │   ├── TaskModal.jsx
    │   │   │   ├── ProjectModal.jsx
    │   │   │   ├── CreateTeamModal.jsx
    │   │   │   └── InviteMemberModal.jsx
    │   │   ├── layout/
    │   │   │   ├── AuthLayout.jsx
    │   │   │   └── DashboardLayout.jsx
    │   │   ├── Navbar.jsx
    │   │   └── Sidebar.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── Tasks.jsx
    │   │   ├── Team.jsx
    │   │   ├── Settings.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── api/
    │   │   └── axios.js
    │   ├── routes/
    │   │   └── ProtectedRoutes.jsx
    │   ├── main.jsx
    │   └── App.jsx
    ├── public/
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (running locally or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Start backend server (port 5001)
   cd backend
   npm run dev

   # Start frontend development server (port 5173)
   cd ../frontend
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/task-manager
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
FRONTEND_URL=http://localhost:5173
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/register
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

#### POST /api/v1/auth/login
Authenticate user and receive JWT token
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/v1/auth/me
Get current user profile (requires authentication)

#### GET /api/v1/auth/users
Get all users (Admin/Manager only)

### Project Endpoints

#### GET /api/v1/projects
Get all projects (user's projects or all if admin)

#### POST /api/v1/projects
Create new project
```json
{
  "title": "New Project",
  "description": "Project description",
  "status": "active"
}
```

#### PUT /api/v1/projects/:id
Update existing project

#### DELETE /api/v1/projects/:id
Delete project (owner/admin only)

### Task Endpoints

#### GET /api/v1/tasks
Get tasks with filtering and pagination
```json
{
  "search": "task title",
  "status": "In Progress",
  "priority": "High",
  "project": "project-id"
}
```

#### POST /api/v1/tasks
Create new task
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "To Do",
  "priority": "Medium",
  "project": "project-id",
  "dueDate": "2024-12-31"
}
```

#### PUT /api/v1/tasks/:id
Update task status (drag and drop)

### Team Endpoints

#### GET /api/v1/teams
Get all teams (user's teams or all if admin)

#### POST /api/v1/teams
Create new team
```json
{
  "name": "Development Team",
  "description": "Team responsible for development"
}
```

#### POST /api/v1/teams/:id/members
Add member to team
```json
{
  "userId": "user-id",
  "role": "member"
}
```

## 🎯 User Roles

### Admin
- Full system access
- Manage all users
- Manage all projects and teams
- Delete any content

### Manager
- Manage team members
- Create and manage projects
- View all tasks in managed projects

### User
- View assigned tasks
- Participate in team projects
- Manage own profile

## 🎨 UI Features

### Dashboard
- **Statistics Cards**: Total projects, tasks, completion rate
- **Activity Chart**: 7-day task creation trend
- **Status Distribution**: Pie chart of task statuses
- **Recent Tasks**: Latest task updates
- **Overdue Tasks**: Tasks past due date

### Kanban Board
- **Drag & Drop**: Smooth task movement between columns
- **Four Columns**: To Do, In Progress, In Review, Completed
- **Task Cards**: Rich task information display
- **Priority Indicators**: Color-coded priority badges
- **Due Date Display**: Calendar integration

### Project Management
- **Project Cards**: Visual project representation
- **Status Badges**: Active, Completed, On Hold
- **Member Count**: Team member display
- **Quick Actions**: Edit, delete, member management

### Team Management
- **Team Creation**: Modal-based team setup
- **Member Invitation**: Email invitation system
- **Role Management**: Dropdown-based role assignment
- **User Directory**: Searchable member list
- **Permission Control**: Access level management

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

#### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Code Quality
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **No Comments**: Clean, production-ready code
- **Git Ready**: Comprehensive .gitignore included

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start backend in production mode
cd ../backend
npm start
```

### Environment Setup
- **Node.js**: v18+ required
- **MongoDB**: Connection string in .env
- **CORS**: Properly configured for production domains
- **JWT**: Secure secret keys for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Follow the existing code style
5. Test thoroughly
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **React Team**: For the amazing React framework
- **TailwindCSS**: For the utility-first CSS framework
- **Lucide**: For the beautiful icon set
- **MongoDB**: For the flexible database solution

---

**Built with ❤️ using modern web technologies**
