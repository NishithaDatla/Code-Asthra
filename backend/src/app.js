import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import procurementRequestRoutes from './routes/procurementRequestRoutes.js';
import centreRoutes from './routes/centreRoutes.js';
import schedulingRoutes from './routes/schedulingRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import procurementRoutes from './routes/procurementRoutes.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration using centralized environment
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);

// HTTP request logging
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Procurement Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Farmer Routes
app.use('/api/farmer', farmerRoutes);

// Procurement Request Routes
app.use('/api/procurement-requests', procurementRequestRoutes);

// Procurement Centre Routes
app.use('/api/centres', centreRoutes);

// Smart Scheduling & Recommendation Routes
app.use('/api/scheduling', schedulingRoutes);

// Booking Routes
app.use('/api/bookings', bookingRoutes);

// Queue Management & Atomic State Machine Routes
app.use('/api/queue', queueRoutes);

// Notification Triggering Routes
app.use('/api/notifications', notificationRoutes);

// Procurement Processing & Verification Routes
app.use('/api/procurement', procurementRoutes);

// Minimal error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

export default app;
