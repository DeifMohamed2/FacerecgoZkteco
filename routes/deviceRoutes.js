const express = require('express');
const router = express.Router();
const { deviceStatus, devices } = require('../config/devices');
const axios = require('axios');

// Get all devices status
router.get('/status', (req, res) => {
    const statusArray = Array.from(deviceStatus.values()).map(device => ({
        name: device.name,
        ip: device.ip,
        port: device.port,
        connected: device.connected,
        lastSeen: device.lastSeen,
        status: device.status,
        sn: device.sn || 'Not registered'
    }));

    res.json(statusArray);
});

// Check device connection
router.post('/check/:ip', async (req, res) => {
    try {
        const device = deviceStatus.get(req.params.ip);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        try {
            const url = `http://${device.ip}:${device.port}/api/device/info`;
            const response = await axios.get(url, {
                auth: {
                    username: device.username,
                    password: device.password
                },
                timeout: 3000
            });

            deviceStatus.set(device.ip, {
                ...device,
                connected: true,
                lastSeen: new Date(),
                status: 'Connected',
                sn: response.data?.SN || device.sn || ''
            });

            res.json({
                success: true,
                connected: true,
                device: deviceStatus.get(device.ip)
            });
        } catch (error) {
            deviceStatus.set(device.ip, {
                ...device,
                connected: false,
                status: 'Disconnected',
                lastSeen: device.lastSeen
            });

            res.json({
                success: false,
                connected: false,
                error: error.message
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new device
router.post('/add', (req, res) => {
    try {
        const { name, ip, port, username, password } = req.body;

        if (!name || !ip) {
            return res.status(400).json({ error: 'Name and IP are required' });
        }

        const newDevice = {
            name,
            ip,
            port: port || 80,
            username: username || 'admin',
            password: password || 'admin',
            sn: '',
            connected: false,
            lastSeen: null,
            status: 'Disconnected'
        };

        deviceStatus.set(ip, newDevice);
        devices.push({
            name,
            ip,
            port: port || 80,
            username: username || 'admin',
            password: password || 'admin',
            sn: ''
        });

        res.json({
            success: true,
            device: newDevice
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

