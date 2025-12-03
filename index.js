import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import deviceRoutes from './routes/deviceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8090;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zkteco';

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Device endpoints (ZKTeco device communication)
app.use('/iclock', deviceRoutes);

// Admin API endpoints
app.use('/api', apiLimiter, adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'ZKTeco SenseFace 2A Integration',
        version: '1.0.0',
        endpoints: {
            device: {
                ping: 'GET /iclock/ping',
                getrequest: 'GET /iclock/getrequest?SN=<sn>',
                cdata: 'POST /iclock/cdata'
            },
            admin: {
                devices: 'GET/POST /api/devices',
                users: 'GET/POST /api/users',
                attendance: 'GET /api/attendance',
                commands: 'POST /api/devices/:sn/command',
                webhooks: 'GET/POST /api/webhooks'
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Connect to MongoDB and start server
async function startServer() {
    try {
        await mongoose.connect(MONGO_URI, {
            // Remove deprecated options for newer mongoose versions
        });
        console.log('✓ Connected to MongoDB');
        
        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ Health check: http://localhost:${PORT}/health`);
            console.log(`✓ Device ping: http://localhost:${PORT}/iclock/ping`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

// Start the server
startServer();


