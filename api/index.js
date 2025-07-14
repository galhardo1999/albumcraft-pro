import express from 'express';

const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for API routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'AlbumCraftPro API is running'
  });
});

// NextAuth endpoints placeholder
app.all('/api/auth/*', (req, res) => {
  res.status(503).json({ 
    error: 'Authentication service not configured',
    message: 'Please configure database and NextAuth environment variables'
  });
});

// API endpoints placeholder
app.all('/api/*', (req, res) => {
  res.status(503).json({ 
    error: 'API service not fully configured',
    message: 'Database connection required. Please check environment variables.',
    endpoint: req.path,
    method: req.method
  });
});

export default app;