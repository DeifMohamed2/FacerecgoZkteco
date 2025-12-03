import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limiter for device endpoints
export const deviceLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 60, // 60 requests per minute per IP
    message: 'Too many device requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict rate limiter for admin endpoints
export const adminLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 20, // 20 requests per minute
    message: 'Too many admin requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});


