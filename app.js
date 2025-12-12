const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// --- CONFIGURATION ---
// Ensure this port matches what you put in the Senseface 2A device settings
const PORT = 8090; 

// --- MIDDLEWARE ---
// ZKTeco devices often send data as plain text or strange formats, 
// so we use raw/text parsers to capture everything.
app.use(bodyParser.text({ type: '*/*' }));
app.use(bodyParser.urlencoded({ extended: true }));

// --- LOGGING ---
// This middleware logs EVERY request. If the device connects, you WILL see it here.
app.use((req, res, next) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] INCOMING REQUEST:`);
    console.log(`Method: ${req.method} | URL: ${req.url}`);
    console.log(`Query Params:`, req.query);
    console.log(`Body:`, req.body);
    next();
});

// --- ZKTECO ADMS ROUTES ---

// 1. HANDSHAKE & CONFIGURATION (GET /iclock/cdata)
// The device calls this to check server availability and sync settings.
app.get('/iclock/cdata', (req, res) => {
    // The device usually sends ?options=all&language=...
    // We respond with the standard ADMS config string.
    console.log('>> Handshake received. Sending config...');
    
    // This response tells the device: "Server is Ready, sync every 60s"
    res.send('GET OPTION FROM: SN\r\nATTLOGStamp=None\r\nOPERLOGStamp=None\r\nATTPHOTOStamp=None\r\nErrorDelay=30\r\nDelay=10\r\nTransTimes=00:00;14:05\r\nTransInterval=1\r\nTransFlag=1111000000\r\nRealtime=1\r\nEncrypt=0\r\n');
});

// 2. RECEIVE ATTENDANCE DATA (POST /iclock/cdata)
// The device POSTs the attendance logs here.
app.post('/iclock/cdata', (req, res) => {
    const sn = req.query.SN;
    const table = req.query.table; // usually 'ATTLOG'

    if (table === 'ATTLOG') {
        console.log(`>> RECEIVED ATTENDANCE LOGS FROM ${sn}`);
        console.log('Data Content:', req.body);
        
        // TODO: Parse 'req.body' and save to your database here.
        // Format is usually: UserID, Date, VerifyMode, etc.
    }

    // CRITICAL: You MUST reply "OK" or the device will keep sending the same data forever.
    res.send('OK'); 
});

// 3. COMMAND POLLING (GET /iclock/getrequest)
// The device asks: "Do you have any commands for me?" (like Open Door, Delete User)
app.get('/iclock/getrequest', (req, res) => {
    // If no commands, send "OK"
    res.send('OK');
});

// 4. DEVICE COMMAND RESULTS (POST /iclock/devicecmd)
// If you sent a command, the device reports the result here.
app.post('/iclock/devicecmd', (req, res) => {
    console.log('>> Device executed command:', req.body);
    res.send('OK');
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`ZKTeco ADMS Server is running on Port: ${PORT}`);
    console.log(`Waiting for Senseface 2A connection...`);
    console.log(`-----------------------------------------------`);
});