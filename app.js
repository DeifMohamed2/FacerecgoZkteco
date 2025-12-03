const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const HOST_IP = '0.0.0.0'; // Listen on all network interfaces
const PORT = 8090;
const DEVICE_IP = '82.25.101.207'; // This is just for logging/reference

const ATTENDANCE_FILE = path.join(__dirname, 'student_attendance.txt');

const app = express();

// Use middleware to parse plain text body, as ZK devices often send data 
// as application/x-www-form-urlencoded or plain text.
app.use(bodyParser.text({ type: '*/*' }));
// ---------------------

/**
 * 1. Initial Connection / Heartbeat Request: /iclock/getrequest
 * The device PULLS commands from the server. The server can send commands here.
 */
app.get('/iclock/getrequest', (req, res) => {
    const sn = req.query.SN || 'UNKNOWN';
    const deviceTime = req.query.AT || 'N/A';

    console.log(`\n✅ Device Connected! (IP: ${req.ip})`);
    console.log(`[Heartbeat] SN: ${sn}, Time: ${deviceTime}`);
    console.log(`[Request] Query Params:`, req.query);

    // *TESTING CONNECTION THING 1: Log that you received the request.*
    
    // The device expects an "OK" response or a command to execute. 
    // An empty "OK" response tells the device to proceed with its normal push logic.
    res.set('Content-Type', 'text/plain');
    res.send('OK'); 

    // --- Optional: Send a command back to the device (e.g., get logs) ---
    // If you wanted to PULL attendance logs, you'd respond with a command like:
    // res.send('GETATTELOG\r\n');
    // For now, we rely on the device's PUSH mechanism.
});

/**
 * 2. Data Push Request: /iclock/cdata
 * The device PUSHES attendance (ATTLOG) or user data (OPERLOG/USERINFO).
 */
app.post('/iclock/cdata', (req, res) => {
    const sn = req.query.SN || 'UNKNOWN';
    const table = req.query.table || 'UNKNOWN';
    const rawData = req.body;

    console.log(`\n⬆️ Data Push Received! (Table: ${table})`);
    console.log(`[Request] SN: ${sn}, Table: ${table}`);
    
    // *TESTING CONNECTION THING 2: Log that you received the POST data.*

    if (table === 'ATTLOG') {
        // --- Process Attendance Logs ---
        console.log(`[ATTLOG] Raw Data:\n${rawData.trim()}`);
        
        const logs = rawData.trim().split('\n');
        
        logs.forEach(log => {
            // Logs are usually tab-separated: PIN\tTime\tStatus\tVerifyType...
            const parts = log.split('\t');
            if (parts.length > 1) {
                const studentId = parts[0];
                const timestamp = parts[1];
                
                // Format the line to write to the file: ID,Timestamp
                const record = `${studentId},${timestamp}\n`;
                
                // Write the extracted ID and timestamp to the simple file
                fs.appendFile(ATTENDANCE_FILE, record, (err) => {
                    if (err) {
                        console.error('❌ Error writing to file:', err);
                    } else {
                        console.log(`   ✅ Wrote ID ${studentId} to file.`);
                    }
                });
            }
        });
        
    } else {
        console.log(`[Other Data] Table: ${table}, Raw Data:\n${rawData.trim()}`);
    }

    // The server MUST respond with 'OK' to confirm receipt and prevent re-pushing.
    res.set('Content-Type', 'text/plain');
    res.send('OK');
});

// Start the server
app.listen(PORT, HOST_IP, () => {
    console.log(`\n🌐 ADMS Server Running on http://${DEVICE_IP}:${PORT}`);
    console.log(`   - Server is listening on all interfaces at port ${PORT}`);
    console.log(`   - Waiting for ZKTeco SenseFace 2A connection...`);
    console.log(`\n-- Attendance logs will be saved to: ${ATTENDANCE_FILE}`);
});