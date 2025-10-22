const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Route imports
const auth = require('./routes/authh');
const todos = require('./routes/todos');
const reminders = require('./routes/reminders');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Todo API Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (auth required)'
      },
      todos: {
        get: 'GET /api/todos (auth required)',
        create: 'POST /api/todos (auth required)',
        update: 'PUT /api/todos/:id (auth required)',
        delete: 'DELETE /api/todos/:id (auth required)'
      },
      reminders: 'GET /api/reminders (auth required)',
      health: 'GET /api/health'
    }
  });
});

// Mount routers
app.use('/api/auth', auth);
app.use('/api/todos', todos);
app.use('/api/reminders', reminders);

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://altafrajavines_db_user:X88rbXzEVrk4OEo6@cluster0.lv1rwea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ MongoDB Connected');
    
    // Start server only after DB connection
    const server = app.listen(PORT, 'localhost', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📍 Frontend: http://localhost:5173`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try changing the PORT in .env file');
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure MongoDB is running on your system');
    process.exit(1);
  }
};

connectDB();