#!/bin/bash

# Railway Deployment Script for Task Manager
# This script helps prepare and deploy the application to Railway

echo "🚀 Railway Deployment Setup for Task Manager"
echo "=========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Deploy backend
echo "📦 Deploying backend..."
cd backend
railway up
echo "✅ Backend deployed!"

# Get backend URL
BACKEND_URL=$(railway domains --json | jq -r '.[0].url')
echo "🔗 Backend URL: $BACKEND_URL"

# Deploy frontend
echo "📦 Deploying frontend..."
cd ../frontend
railway up
echo "✅ Frontend deployed!"

# Get frontend URL
FRONTEND_URL=$(railway domains --json | jq -r '.[0].url')
echo "🔗 Frontend URL: $FRONTEND_URL"

# Update environment variables
echo "⚙️ Setting up environment variables..."
cd ../backend

# Set frontend URL in backend
railway variables set FRONTEND_URL=$FRONTEND_URL

echo "✅ Deployment complete!"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend: $BACKEND_URL"
echo ""
echo "📝 Next steps:"
echo "1. Set up MongoDB Atlas"
echo "2. Update MONGO_URI environment variable"
echo "3. Test the application"
