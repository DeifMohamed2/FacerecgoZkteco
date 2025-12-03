import express from 'express';
import Device from '../models/Device.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Command from '../models/Command.js';
import Webhook from '../models/Webhook.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import { auditLog } from '../middleware/validation.js';
import { forwardToWebhooks } from '../services/webhookService.js';
import { getWebhookLogs } from '../services/webhookService.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Simple login endpoint (for demo - implement proper auth in production)
 * This route must be defined BEFORE authentication middleware
 */
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // TODO: Implement proper authentication
        // For now, this is a placeholder
        // In production, verify against database, use bcrypt for passwords, etc.
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        // Placeholder authentication
        // Replace with actual user authentication
        const token = generateToken({ userId: username, role: 'admin' });
        
        res.json({ token, user: { username, role: 'admin' } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// All admin routes require authentication
router.use(authenticateToken);
router.use(adminLimiter);

/**
 * POST /api/devices
 * Register a new device
 */
router.post('/devices', 
    auditLog('CREATE', 'device'),
    async (req, res) => {
    try {
        const { sn, name, ip, port, public: isPublic, metadata } = req.body;
        
        if (!sn) {
            return res.status(400).json({ error: 'Device SN is required' });
        }
        
        const device = await Device.create({
            sn: sn.trim(),
            name: name || '',
            ip: ip || '',
            port: port || 80,
            public: isPublic || false,
            metadata: metadata || {},
            lastSeen: new Date()
        });
        
        await forwardToWebhooks('device_status', {
            action: 'device_registered',
            deviceSN: device.sn,
            device: device
        });
        
        res.status(201).json(device);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Device with this SN already exists' });
        }
        console.error('Device creation error:', error);
        res.status(500).json({ error: 'Failed to create device' });
    }
});

/**
 * GET /api/devices
 * List all devices
 */
router.get('/devices', async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const query = {};
        if (search) {
            query.$or = [
                { sn: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { ip: { $regex: search, $options: 'i' } }
            ];
        }
        
        const [devices, total] = await Promise.all([
            Device.find(query)
                .sort({ lastSeen: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Device.countDocuments(query)
        ]);
        
        res.json({
            devices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Device list error:', error);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

/**
 * GET /api/devices/:sn
 * Get device by SN
 */
router.get('/devices/:sn', async (req, res) => {
    try {
        const device = await Device.findOne({ sn: req.params.sn });
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        res.json(device);
    } catch (error) {
        console.error('Device fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch device' });
    }
});

/**
 * PUT /api/devices/:sn
 * Update device
 */
router.put('/devices/:sn',
    auditLog('UPDATE', 'device'),
    async (req, res) => {
    try {
        const { name, ip, port, public: isPublic, metadata } = req.body;
        
        const device = await Device.findOneAndUpdate(
            { sn: req.params.sn },
            {
                $set: {
                    ...(name !== undefined && { name }),
                    ...(ip !== undefined && { ip }),
                    ...(port !== undefined && { port }),
                    ...(isPublic !== undefined && { public: isPublic }),
                    ...(metadata !== undefined && { metadata }),
                    updatedAt: new Date()
                }
            },
            { new: true, runValidators: true }
        );
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        res.json(device);
    } catch (error) {
        console.error('Device update error:', error);
        res.status(500).json({ error: 'Failed to update device' });
    }
});

/**
 * DELETE /api/devices/:sn
 * Delete device
 */
router.delete('/devices/:sn',
    auditLog('DELETE', 'device'),
    async (req, res) => {
    try {
        const device = await Device.findOneAndDelete({ sn: req.params.sn });
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        res.json({ message: 'Device deleted successfully' });
    } catch (error) {
        console.error('Device delete error:', error);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/users',
    auditLog('CREATE', 'user'),
    async (req, res) => {
    try {
        const { empId, name, cardNo, faceTemplateId, devices, meta } = req.body;
        
        if (!empId) {
            return res.status(400).json({ error: 'Employee ID is required' });
        }
        
        const user = await User.create({
            empId: empId.trim(),
            name: name || '',
            cardNo: cardNo || '',
            faceTemplateId: faceTemplateId || '',
            devices: devices || [],
            meta: meta || {}
        });
        
        await forwardToWebhooks('user_enrolled', {
            action: 'user_created',
            user: user
        });
        
        res.status(201).json(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'User with this Employee ID already exists' });
        }
        console.error('User creation error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * GET /api/users
 * List all users
 */
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const query = {};
        if (search) {
            query.$or = [
                { empId: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { cardNo: { $regex: search, $options: 'i' } }
            ];
        }
        
        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);
        
        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('User list error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * GET /api/users/:empId
 * Get user by employee ID
 */
router.get('/users/:empId', async (req, res) => {
    try {
        const user = await User.findOne({ empId: req.params.empId });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * PUT /api/users/:empId
 * Update user
 */
router.put('/users/:empId',
    auditLog('UPDATE', 'user'),
    async (req, res) => {
    try {
        const { name, cardNo, faceTemplateId, devices, meta } = req.body;
        
        const user = await User.findOneAndUpdate(
            { empId: req.params.empId },
            {
                $set: {
                    ...(name !== undefined && { name }),
                    ...(cardNo !== undefined && { cardNo }),
                    ...(faceTemplateId !== undefined && { faceTemplateId }),
                    ...(devices !== undefined && { devices }),
                    ...(meta !== undefined && { meta }),
                    updatedAt: new Date()
                }
            },
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * DELETE /api/users/:empId
 * Delete user
 */
router.delete('/users/:empId',
    auditLog('DELETE', 'user'),
    async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ empId: req.params.empId });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('User delete error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

/**
 * GET /api/attendance
 * Query attendance logs
 */
router.get('/attendance', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 100, 
            deviceSN, 
            empId, 
            startDate, 
            endDate 
        } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const query = {};
        
        if (deviceSN) query.deviceSN = deviceSN;
        if (empId) query.empId = empId;
        
        if (startDate || endDate) {
            query.time = {};
            if (startDate) query.time.$gte = new Date(startDate);
            if (endDate) query.time.$lte = new Date(endDate);
        }
        
        const [attendance, total] = await Promise.all([
            Attendance.find(query)
                .sort({ time: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Attendance.countDocuments(query)
        ]);
        
        res.json({
            attendance,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Attendance query error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

/**
 * POST /api/devices/:sn/command
 * Queue a command for a device
 */
router.post('/devices/:sn/command',
    auditLog('CREATE', 'command'),
    async (req, res) => {
    try {
        const { command, args } = req.body;
        
        if (!command) {
            return res.status(400).json({ error: 'Command is required' });
        }
        
        // Verify device exists
        const device = await Device.findOne({ sn: req.params.sn });
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        const cmd = await Command.create({
            deviceSN: req.params.sn,
            command: command,
            args: args || {}
        });
        
        res.status(201).json(cmd);
    } catch (error) {
        console.error('Command creation error:', error);
        res.status(500).json({ error: 'Failed to create command' });
    }
});

/**
 * GET /api/devices/:sn/commands
 * Get commands for a device
 */
router.get('/devices/:sn/commands', async (req, res) => {
    try {
        const { processed, limit = 50 } = req.query;
        
        const query = { deviceSN: req.params.sn };
        if (processed !== undefined) {
            query.processed = processed === 'true';
        }
        
        const commands = await Command.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        res.json(commands);
    } catch (error) {
        console.error('Command fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch commands' });
    }
});

/**
 * POST /api/webhooks
 * Register a webhook
 */
router.post('/webhooks',
    auditLog('CREATE', 'webhook'),
    async (req, res) => {
    try {
        const { url, events, secret, metadata } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'Webhook URL is required' });
        }
        
        if (!events || !Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ error: 'At least one event type is required' });
        }
        
        const webhook = await Webhook.create({
            url: url.trim(),
            events: events,
            secret: secret || '',
            metadata: metadata || {},
            active: true
        });
        
        res.status(201).json(webhook);
    } catch (error) {
        console.error('Webhook creation error:', error);
        res.status(500).json({ error: 'Failed to create webhook' });
    }
});

/**
 * GET /api/webhooks
 * List all webhooks
 */
router.get('/webhooks', async (req, res) => {
    try {
        const webhooks = await Webhook.find().sort({ createdAt: -1 });
        res.json(webhooks);
    } catch (error) {
        console.error('Webhook list error:', error);
        res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
});

/**
 * GET /api/webhooks/:id/logs
 * Get webhook logs
 */
router.get('/webhooks/:id/logs', async (req, res) => {
    try {
        const { status, event, startDate, endDate, limit = 100 } = req.query;
        
        const logs = await getWebhookLogs({
            webhookId: req.params.id,
            status,
            event,
            startDate,
            endDate,
            limit: parseInt(limit)
        });
        
        res.json(logs);
    } catch (error) {
        console.error('Webhook log fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }
});

/**
 * PUT /api/webhooks/:id
 * Update webhook
 */
router.put('/webhooks/:id',
    auditLog('UPDATE', 'webhook'),
    async (req, res) => {
    try {
        const { url, events, secret, active, metadata } = req.body;
        
        const webhook = await Webhook.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    ...(url !== undefined && { url }),
                    ...(events !== undefined && { events }),
                    ...(secret !== undefined && { secret }),
                    ...(active !== undefined && { active }),
                    ...(metadata !== undefined && { metadata }),
                    updatedAt: new Date()
                }
            },
            { new: true, runValidators: true }
        );
        
        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        
        res.json(webhook);
    } catch (error) {
        console.error('Webhook update error:', error);
        res.status(500).json({ error: 'Failed to update webhook' });
    }
});

/**
 * DELETE /api/webhooks/:id
 * Delete webhook
 */
router.delete('/webhooks/:id',
    auditLog('DELETE', 'webhook'),
    async (req, res) => {
    try {
        const webhook = await Webhook.findByIdAndDelete(req.params.id);
        
        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        
        res.json({ message: 'Webhook deleted successfully' });
    } catch (error) {
        console.error('Webhook delete error:', error);
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
});

export default router;

