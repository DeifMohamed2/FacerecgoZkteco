// Device configuration
// Add your SensFace device IPs and credentials here
const devices = [
    {
        name: 'Device 1',
        ip: '192.168.1.8',
        port: 80,
        username: 'admin',
        password: 'admin',
        sn: '' // Will be populated when device connects
    },
    // Add more devices as needed
    // {
    //     name: 'Device 2',
    //     ip: '192.168.1.202',
    //     port: 80,
    //     username: 'admin',
    //     password: 'admin',
    //     sn: ''
    // }
];

// Real-time device status tracking (in-memory, not in DB)
const deviceStatus = new Map();

// Initialize device status
devices.forEach(device => {
    deviceStatus.set(device.ip, {
        ...device,
        connected: false,
        lastSeen: null,
        status: 'Disconnected'
    });
});

module.exports = {
    devices,
    deviceStatus
};
