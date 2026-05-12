# Railway Deployment Guide

This guide will help you deploy the Task Manager application on Railway.

## 🚀 Prerequisites

- **Railway Account**: Create a free account at [railway.app](https://railway.app)
- **GitHub Repository**: Push your code to GitHub
- **MongoDB Atlas**: Free MongoDB database (recommended for production)

## 📋 Deployment Overview

We'll deploy two separate services:
1. **Backend API** (Node.js + Express)
2. **Frontend App** (React + Vite)

## 🔧 Step 1: Prepare Backend

### 1.1 Update Environment Variables
Create a `.env.example` file in the backend:

```env
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
FRONTEND_URL=https://your-frontend-url.railway.app
```

### 1.2 Railway Configuration
The `backend/railway.json` is already configured with:
- Nixpacks builder for Node.js
- Proper start command
- Health check configuration

## 🔧 Step 2: Deploy Backend

### 2.1 Connect Railway to GitHub
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select the task manager repository

### 2.2 Configure Backend Service
1. **Select Repository**: Choose your repository
2. **Select Branch**: Choose `main` or `master`
3. **Root Directory**: Set to `backend` (IMPORTANT!)
4. **Build Command**: Leave as default (npm install)
5. **Start Command**: `npm start`
6. **Verify**: Railway should detect the Node.js project from backend/package.json

### 2.3 Set Environment Variables
In Railway dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
FRONTEND_URL=https://your-frontend-url.railway.app
```

### 2.4 Deploy Backend
1. Click "Deploy"
2. Wait for the build to complete
3. Copy the backend URL (e.g., `https://task-manager-api.railway.app`)

## 🔧 Step 3: Deploy Frontend

### 3.1 Configure Frontend Service
1. In Railway, click "New Service" → "Deploy from GitHub repo"
2. Select the same repository
3. **Root Directory**: Set to `frontend` (IMPORTANT!)
4. **Build Command**: `npm run build`
5. **Start Command**: `npm run preview`
6. **Verify**: Railway should detect the React/Vite project from frontend/package.json

### 3.2 Set Frontend Environment Variables
Add these environment variables for the frontend:

```env
VITE_API_URL=https://your-backend-url.railway.app/api/v1
```

### 3.3 Deploy Frontend
1. Click "Deploy"
2. Wait for the build to complete
3. Copy the frontend URL

## 🔧 Step 4: Update CORS Configuration

### 4.1 Update Backend CORS
In Railway dashboard, update the `FRONTEND_URL` environment variable:

```env
FRONTEND_URL=https://your-frontend-url.railway.app
```

### 4.2 Redeploy Backend
1. Go to the backend service
2. Click "Redeploy"
3. Wait for deployment to complete

## 🔧 Step 5: MongoDB Atlas Setup (Recommended)

### 5.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account

### 5.2 Create Cluster
1. Click "Create Cluster"
2. Choose "M0 Sandbox" (free tier)
3. Select a cloud provider and region

### 5.3 Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)

### 5.4 Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Enter username and password
4. Select "Read and write to any database"

### 5.5 Get Connection String
1. Go to "Clusters" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `taskmanager`

### 5.6 Update Railway Environment
Update the `MONGO_URI` in Railway backend environment variables:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager
```

## 🔧 Step 6: Test Deployment

### 6.1 Test Backend API
Visit your backend URL with `/` to test:
```
https://your-backend-url.railway.app/
```

You should see: "Task Manager API is running..."

### 6.2 Test Frontend App
Visit your frontend URL:
```
https://your-frontend-url.railway.app
```

### 6.3 Test User Registration
1. Go to the frontend URL
2. Click "Register"
3. Create a new account
4. Verify you can login and see the dashboard

## 🔧 Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain
1. In Railway, go to service settings
2. Click "Custom Domains"
3. Add your domain name
4. Follow DNS configuration instructions

### 7.2 Update Environment Variables
Update `FRONTEND_URL` in backend to use your custom domain.

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failed - "no builders available" or "Nixpacks was unable to generate a build plan"
**Cause**: Railway is trying to build from the root directory instead of the specific service directory.

**Solution**:
1. Delete the current failed deployment
2. Create a new service
3. **IMPORTANT**: Set "Root Directory" to either `backend` or `frontend`
4. For backend: Set to `backend`
5. For frontend: Set to `frontend`
6. Railway should now detect the correct project type

#### 2. CORS Errors
- Make sure `FRONTEND_URL` matches your frontend URL exactly
- Include `https://` and no trailing slash

#### 2. Database Connection
- Verify MongoDB Atlas IP access allows all IPs (0.0.0.0/0)
- Check connection string format
- Ensure database user has correct permissions

#### 3. Build Failures
- Check package.json for correct scripts
- Verify all dependencies are installed
- Check for syntax errors in code

#### 4. Frontend Not Loading
- Ensure VITE_API_URL is set correctly
- Check that backend is running
- Verify CORS configuration

### Debug Logs
1. Go to Railway service
2. Click "Logs" tab
3. Check for error messages
4. Use logs to identify issues

## 🔧 Railway Features Used

### Automatic Deployments
- Railway automatically deploys on GitHub push
- Connected to main branch
- Zero-downtime deployments

### Environment Variables
- Secure configuration management
- Separate variables for each service
- Easy updates without redeployment

### Health Checks
- Automatic health monitoring
- Restart on failure
- Custom health check paths

### Scaling
- Automatic scaling based on traffic
- Free tier includes basic scaling
- Upgrade options for higher traffic

## 🔧 Production Best Practices

### Security
- Use strong JWT secrets
- Enable HTTPS (automatic on Railway)
- Regularly update dependencies
- Use MongoDB Atlas for secure database

### Performance
- Enable MongoDB Atlas indexing
- Use Railway's built-in CDN
- Optimize bundle size
- Monitor resource usage

### Monitoring
- Check Railway logs regularly
- Monitor database performance
- Set up alerts for errors
- Track user analytics

## 🔧 Cost Management

### Free Tier Limits
- **Backend**: 500 hours/month free
- **Frontend**: 500 hours/month free
- **Database**: MongoDB Atlas M0 free tier
- **Storage**: 1GB free per service

### When to Upgrade
- High traffic applications
- Need for custom domains
- Additional storage requirements
- Advanced monitoring needs

## 🎉 Success!

Your Task Manager application is now live on Railway! Users can:
- Register and login
- Create and manage projects
- Create and manage tasks with Kanban board
- Invite team members
- Manage teams and roles

The application is fully functional with:
- ✅ Secure authentication
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Team collaboration features

## 📞 Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **MongoDB Atlas Docs**: [docs.mongodb.com](https://docs.mongodb.com)
- **React Documentation**: [react.dev](https://react.dev)
