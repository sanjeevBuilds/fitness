# 🚀 Deployment Checklist

## Pre-Deployment Setup

### 1. Backend Preparation (Render)
- [ ] **MongoDB Setup**
  - [ ] Create MongoDB Atlas account (if not already done)
  - [ ] Create a new cluster
  - [ ] Get connection string
  - [ ] Whitelist IP addresses (0.0.0.0/0 for Render)

- [ ] **Environment Variables**
  - [ ] Generate a strong JWT_SECRET (use a random string generator)
  - [ ] Note down your MongoDB connection string
  - [ ] Prepare PORT variable (usually 8000)

### 2. Frontend Preparation (Vercel)
- [ ] **API URL Configuration**
  - [ ] Update `FrontEnd/deploy-config.js` with your Render URL
  - [ ] Run: `cd FrontEnd && node deploy-config.js deploy`
  - [ ] Verify all API calls are updated

## Backend Deployment (Render)

### 1. Create Render Account
- [ ] Sign up at [render.com](https://render.com)
- [ ] Connect your GitHub account

### 2. Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repository
- [ ] Configure settings:
  - **Name**: `health-fitness-backend` (or your preferred name)
  - **Root Directory**: `BackEnd`
  - **Runtime**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: Free (or paid if needed)

### 3. Environment Variables
- [ ] Add the following environment variables:
  ```
  MONGO_URL=your_mongodb_connection_string
  JWT_SECRET=your_generated_jwt_secret
  PORT=8000
  ```

### 4. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Note down your Render URL (e.g., `https://your-app-name.onrender.com`)

## Frontend Deployment (Vercel)

### 1. Create Vercel Account
- [ ] Sign up at [vercel.com](https://vercel.com)
- [ ] Connect your GitHub account

### 2. Import Project
- [ ] Click "New Project"
- [ ] Import your GitHub repository
- [ ] Configure settings:
  - **Framework Preset**: Other
  - **Root Directory**: `FrontEnd`
  - **Build Command**: Leave empty (or `echo "Frontend is static"`)
  - **Output Directory**: `Public`
  - **Install Command**: Leave empty

### 3. Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note down your Vercel URL

## Post-Deployment Testing

### 1. Backend Testing
- [ ] Test health check: `https://your-app-name.onrender.com/`
- [ ] Test API endpoints using Postman or curl
- [ ] Verify MongoDB connection

### 2. Frontend Testing
- [ ] Visit your Vercel URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Test all major features:
  - [ ] Dashboard
  - [ ] Food logging
  - [ ] Activities
  - [ ] Notifications
  - [ ] Settings

### 3. Integration Testing
- [ ] Verify frontend can communicate with backend
- [ ] Test all API calls work correctly
- [ ] Check for CORS issues
- [ ] Verify authentication works

## Troubleshooting

### Common Issues
- [ ] **CORS Errors**: Backend CORS is already configured
- [ ] **MongoDB Connection**: Check connection string and IP whitelist
- [ ] **JWT Issues**: Verify JWT_SECRET is set correctly
- [ ] **API 404**: Check if routes are properly configured

### Debugging Commands
```bash
# Test backend locally
cd BackEnd
npm install
npm run dev

# Test frontend locally
cd FrontEnd
npx serve Public

# Update API URLs for production
cd FrontEnd
node deploy-config.js deploy

# Revert API URLs for local development
cd FrontEnd
node deploy-config.js revert
```

## Final Steps

- [ ] **Update Documentation**: Update README with live URLs
- [ ] **Set up Monitoring**: Consider adding error tracking
- [ ] **Backup Strategy**: Set up database backups
- [ ] **Domain Setup**: Configure custom domain (optional)
- [ ] **SSL Verification**: Ensure HTTPS is working

## URLs to Save
- **Backend API**: `https://your-app-name.onrender.com`
- **Frontend App**: `https://your-vercel-app.vercel.app`
- **MongoDB Atlas**: Your cluster dashboard URL

## Support
If you encounter issues:
1. Check Render logs for backend errors
2. Check Vercel logs for frontend errors
3. Verify environment variables are set correctly
4. Test API endpoints individually 