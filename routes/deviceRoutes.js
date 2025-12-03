import express from 'express';
import Device from '../models/Device.js';
import Attendance from '../models/Attendance.js';
import Command from '../models/Command.js';
import { validateDeviceSN, validateBodySize } from '../middleware/validation.js';
import { deviceLimiter } from '../middleware/rateLimiter.js';
import { forwardToWebhooks } from '../services/webhookService.js';

const router = express.Router();

/**
 * GET /iclock/ping
 * Device connectivity check
 */
router.get('/ping', deviceLimiter, (req, res) => {
    res.send('OK');
});

/**
 * GET /iclock/getrequest?SN=<sn>
 * Device polls for commands
 */
router.get('/getrequest', deviceLimiter, validateDeviceSN, async (req, res) => {
    try {
        const sn = req.deviceSN;
        
        // Update device lastSeen
        await Device.findOneAndUpdate(
            { sn },
            { $set: { lastSeen: new Date() } },
            { upsert: false }
        );
        
        // Find first unprocessed command for this device
        const cmd = await Command.findOneAndUpdate(
            { deviceSN: sn, processed: false },
            { 
                $set: { 
                    processed: true, 
                    processedAt: new Date() 
                } 
            },
            { sort: { createdAt: 1 } }
        );
        
        if (!cmd) {
            return res.send('OK');
        }
        
        // Format command response for device
        // ZKTeco devices may expect different formats depending on firmware
        // This is a minimal implementation - adjust based on your device's requirements
        const commandResponse = formatCommandForDevice(cmd);
        
        // Forward device status update to webhooks
        await forwardToWebhooks('device_status', {
            deviceSN: sn,
            lastSeen: new Date(),
            commandProcessed: cmd.command
        });
        
        return res.send(commandResponse);
    } catch (err) {
        console.error('getrequest error:', err);
        return res.status(500).send('ERR');
    }
});

/**
 * POST /iclock/cdata
 * Receive attendance data from device
 */
router.post('/cdata', 
    deviceLimiter, 
    validateBodySize(5 * 1024 * 1024), // 5MB max
    async (req, res) => {
    try {
        const payload = req.body;
        
        // Extract device SN from various possible locations
        const sn = payload.SN || payload.sn || req.query.SN || req.query.sn || req.get('SN');
        
        if (!sn) {
            return res.status(400).send('ERR: Device SN required');
        }
        
        // Validate device is registered
        const device = await Device.findOne({ sn });
        if (!device) {
            console.warn(`Unregistered device attempted to send data: ${sn}`);
            // Optionally create device automatically or reject
            // For now, we'll accept but log warning
        }
        
        // Update device lastSeen
        if (device) {
            await Device.findByIdAndUpdate(device._id, { 
                $set: { lastSeen: new Date() } 
            });
        }
        
        // Validate table type (ATTLOG, CHECKIN, etc.)
        const table = payload.table || payload.Table;
        if (table && table !== 'ATTLOG' && table !== 'CHECKIN') {
            console.warn(`Unexpected table type: ${table}`);
        }
        
        // Extract employee ID from various possible fields
        const empId = payload.CardNo || 
                     payload.EnrollNumber || 
                     payload.UserID || 
                     payload.User ||
                     payload.empId ||
                     '';
        
        if (!empId) {
            console.warn('Attendance record missing employee ID:', payload);
        }
        
        // Parse time
        let attendanceTime;
        if (payload.Time) {
            attendanceTime = new Date(payload.Time);
            if (isNaN(attendanceTime.getTime())) {
                attendanceTime = new Date();
            }
        } else {
            attendanceTime = new Date();
        }
        
        // Create attendance record
        const attendance = await Attendance.create({
            deviceSN: sn,
            empId: empId || 'UNKNOWN',
            raw: payload,
            time: attendanceTime,
            status: payload.Status || null,
            verify: payload.Verify || null
        });
        
        // Print user ID when student is attended
        console.log(`[ATTENDANCE] User ID: ${empId || 'UNKNOWN'} - Device: ${sn} - Time: ${attendanceTime.toISOString()}`);
        
        // Forward to webhooks asynchronously
        forwardToWebhooks('attendance', {
            id: attendance._id,
            deviceSN: sn,
            empId: empId,
            time: attendanceTime,
            status: payload.Status,
            verify: payload.Verify
        }).catch(err => {
            console.error('Webhook forwarding error:', err);
        });
        
        return res.send('OK');
    } catch (err) {
        console.error('cdata error:', err);
        return res.status(500).send('ERR');
    }
});

/**
 * Format command for device response
 * Adjust this based on your ZKTeco device firmware requirements
 */
function formatCommandForDevice(cmd) {
    // Minimal format - just return OK
    // For devices that support direct command execution, you may need to return XML or specific format
    // Example: <CMD>RESTART</CMD> or similar
    
    switch (cmd.command.toUpperCase()) {
        case 'RESTART':
        case 'REBOOT':
            return 'OK:REBOOT';
        case 'SYNC_TIME':
            return `OK:SYNCTIME:${new Date().toISOString()}`;
        default:
            return 'OK';
    }
}

export default router;


