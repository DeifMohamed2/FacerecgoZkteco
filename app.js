const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const PORT = 8090; // Must match the port you opened in ufw and set on the device!

// --- MIDDLEWARE ---
// Use raw body parser to capture the specific plain text format ZKTeco uses
app.use(bodyParser.text({ type: '*/*' }));
app.use(bodyParser.urlencoded({ extended: true }));

// --- LOGGING ---
// This logs ALL requests. If the device connects, you WILL see the log here.
app.use((req, res, next) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🟢 INCOMING REQUEST:`);
    console.log(`Method: ${req.method} | URL: ${req.url}`);
    console.log(`Query Params:`, req.query);
    if (req.body && req.body.length > 0) {
        console.log(`Body (Payload): ${req.body}`);
    } else {
        console.log(`Body (Payload): (Empty)`);
    }
    next();
});

// --- PUSH PROTOCOL HANDLERS ---

// Create a handler function for the Handshake to avoid repeating code
const handleHandshake = (req, res) => {
    const sn = req.query.SN || 'UNKNOWN';
    console.log(`>> Handshake received from ${sn}. Sending config...`);

    // The CRITICAL ADMS handshake response, joined by Windows-style line endings (\r\n)
    const handshakeResponse = [
        `GET OPTION FROM: ${sn}`,
        'ATTLOGStamp=0',     // Start time for log retrieval (None/0/YYYY-MM-DD HH:MM:SS)
        'OPERLOGStamp=0',
        'Delay=10',          // Device waits 10 seconds before next poll
        'TransTimes=00:00;14:05', // When device should sync
        'TransInterval=1',   // Sync interval in minutes
        'Realtime=1',        // Enable real-time data push
        'Encrypt=0',         // No encryption
        'OK'
    ].join('\r\n');

    res.set('Content-Type', 'text/plain');
    res.send(handshakeResponse);
};

// 1. GET Request Handlers (Handshake)
app.get('/iclock/cdata', handleHandshake);
app.get('/iclock/cdata.aspx', handleHandshake); // Legacy path compatibility

// 2. POST Request Handler (Attendance Data)
app.post('/iclock/cdata', (req, res) => {
    // This is where you process and save the attendance data (req.body)
    const table = req.query.table; // Should be ATTLOG
    const sn = req.query.SN;
    
    console.log(`>> RECEIVED PUSH DATA: Table=${table} from SN=${sn}`);

    // CRITICAL: Acknowledge receipt to prevent device from re-sending the same data
    res.send('OK'); 
});

// 3. GET Request Handler (Command Polling)
app.get('/iclock/getrequest', (req, res) => {
    // If you have no commands to send to the device:
    res.send('OK'); 
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`ZKTeco ADMS Server is running on Port: ${PORT}`);
    console.log(`Waiting for Senseface 2A connection...`);
    console.log(`-----------------------------------------------`);
});