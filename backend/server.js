require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = async () => {
  try {
    const mongoose = require('mongoose');
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trao-travel-planner');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Non-blocking fallback for local sandbox running if MongoDB is not started yet
    console.log('Server continuing in offline/sandbox demo mode.');
  }
};
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for the simplified development environment
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// DB Connection
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'Trao AI Travel Planner API' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
