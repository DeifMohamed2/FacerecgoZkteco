// server.js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8090; // **CRITICAL: Must match the Server Port in device config (2.4)**

// ZKTeco devices often send raw data, not JSON, so we use raw body parser
app.use(bodyParser.text({ type: '*/*' }));

// --- ADMS PUSH Protocol Endpoint ---
// The SenseFace 2A typically sends data to the '/iclock/cdata.aspx' path.
app.post('/iclock/cdata.aspx', (req, res) => {
    console.log('--- New PUSH Request Received ---');

    // 1. Log Request Metadata
    // The device sends identification info in the query string.
    const deviceSerial = req.query.SN; // SN = Serial Number of the device
    const command = req.query.CMD;     // CMD = The command being sent (e.g., 'POST' or 'GET DATA')
    
    console.log(`Device Serial (SN): ${deviceSerial}`);
    console.log(`Command (CMD): ${command}`);
    
    // 2. Log Raw Body Data
    // The attendance logs are in the body, often in a specific ZKTeco format.
    // For attendance logs, it typically contains "C:Userid:VerifyType:Time:..."
    const rawData = req.body;
    console.log('Raw Data Body:');
    console.log(rawData.toString().trim());
    
    // 3. Process the Data (THIS IS YOUR CORE LOGIC)
    // You need to parse the rawData string (split by '\r\n') and save it to your database.
    if (rawData && rawData.includes('C:')) {
        const logs = rawData.toString().trim().split('\r\n').filter(line => line.startsWith('C:'));
        
        logs.forEach(log => {
            const parts = log.substring(2).split('\t'); // Remove "C:" and split by tab/space
            
            // The exact data structure can vary, but generally includes:
            // parts[0]: User ID
            // parts[1]: Punch Time (YYYY-MM-DD HH:mm:ss)
            // parts[2]: Verify Type (1=Finger, 2=Face, 15=Card, etc.)
            
            if (parts.length >= 3) {
                console.log(`\n🎉 ATTENDANCE LOG: User ID ${parts[0]} at ${parts[1]} (Type: ${parts[2]})`);
                // **TODO: Add logic to save this log to your database**
            }
        });
    }

    // 4. Send Acknowledgment
    // **CRITICAL:** The device expects a simple 'OK' response to confirm receipt.
    // This tells the device to delete the log from its pending buffer.
    res.set('Content-Type', 'text/plain');
    res.send('OK\n'); 
});

// A simple GET endpoint to confirm the server is running
app.get('/', (req, res) => {
    res.send('ZKTeco ADMS Server is running on port ' + PORT);
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ ZKTeco ADMS Listener running on http://YOUR_SERVER_IP:${PORT}`);
    console.log(`   - Server IP: Use this for 'Server Address' on the device.`);
    console.log(`   - Server Port: ${PORT}`);
});