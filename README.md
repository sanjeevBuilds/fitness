# HealthQuest Fitness App

A comprehensive fitness tracking application with separate frontend and backend deployments.

## Project Structure

```
fitness/
├── FrontEnd/           # Deploy to Vercel
│   ├── Public/        # Static HTML/CSS/JS files
│   ├── assets/        # Images and other assets
│   ├── package.json   # Frontend dependencies
│   └── vercel.json    # Vercel configuration
└── BackEnd/           # Deploy to Render
    ├── models/        # MongoDB models
    ├── routes/        # API routes
    ├── server.js      # Express server
    └── package.json   # Backend dependencies
```

## Deployment Instructions

### Backend Deployment (Render)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Set the root directory to `BackEnd`
   - Set the build command: `npm install`
   - Set the start command: `npm start`

2. **Environment Variables (Required)**
   ```
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=8000
   ```

3. **Deploy**
   - Render will automatically deploy when you push to your main branch
   - Your backend will be available at: `https://your-app-name.onrender.com`

### Frontend Deployment (Vercel)

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set the root directory to `FrontEnd`
   - Deploy

3. **Or deploy via CLI**
   ```bash
   cd FrontEnd
   vercel
   ```

4. **Update API Base URL**
   - After backend deployment, update all API calls in your frontend to use the Render URL
   - Example: `https://your-app-name.onrender.com/api`

## Local Development

### Backend
```bash
cd BackEnd
npm install
npm run dev
```

### Frontend
```bash
cd FrontEnd
# Serve static files using any static server
npx serve Public
# or
python -m http.server 3000
```

## API Endpoints

- `POST /api/login` - User login
- `POST /api/register` - User registration
- `GET /api/foodentry` - Get food entries
- `POST /api/foodentry` - Add food entry
- `GET /api/activities` - Get activities
- `POST /api/activities` - Add activity
- `GET /api/notifications` - Get notifications

## Environment Variables

### Backend (.env file)
```
MONGO_URL=mongodb://localhost:27017/Health
JWT_SECRET=your_secret_key_here
PORT=8000
```

## Notes

- The frontend and backend are now completely separated
- Frontend makes API calls to the backend URL
- CORS is configured in the backend to allow frontend requests
- Static files (HTML, CSS, JS) are served by Vercel
- API endpoints are served by Render 