// SensFace 2A / ZKTeco Push Protocol Server
// Node.js - Express

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8090; // <-- Your open firewall port

// Middleware to log all incoming requests for debugging
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log(`\n📨 ${req.method} ${req.path} - Content-Type: ${req.headers['content-type'] || 'none'}`);
    }
    next();
});

// Handle different data formats from ZKTeco devices
// Note: Order matters - more specific parsers first
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/plain', limit: '10mb' }));

// ---------- UTILS ----------
function logEvent(title, data) {
    console.log("\n==============================");
    console.log("📌 " + title);
    console.log("==============================");
    console.log(JSON.stringify(data, null, 2));
    console.log("==============================\n");
}

// ---------- DEVICE PING (TEST IF SERVER IS ALIVE) ----------
app.get("/iclock/cdata", (req, res) => {
    const deviceSN = req.query.SN || 'unknown';
    const deviceType = req.query.DeviceType || 'unknown';
    
    // Log device type to help diagnose
    if (deviceType === 'acc') {
        console.log(`⚠️ Device ${deviceSN} is in ACCESS CONTROL mode - needs T&A PUSH mode for attendance`);
    } else {
        console.log(`✓ Device ping from ${deviceSN} (Type: ${deviceType})`);
    }
    
    // Send response that enables push
    return res.send("OK");
});

// ---------- PUSH ATTENDANCE RECEIVER ----------
app.post("/iclock/cdata", (req, res) => {
    // Debug: Log ALL incoming POST requests
    console.log("\n🔍 POST /iclock/cdata received");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Query params:", req.query);
    console.log("Body type:", typeof req.body);
    console.log("Body:", req.body);
    
    const body = req.body;

    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
        console.log("⚠️ Empty body received - device may not be configured for push");
        return res.send("OK");
    }

    // Handle text/CSV format (common ZKTeco format: PIN,DateTime,Status,Verify)
    if (typeof body === 'string' && body.includes(',')) {
        const lines = body.trim().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const attendanceData = {
                        UserID: parts[0]?.trim(),
                        DateTime: parts[1]?.trim(),
                        Status: parts[2]?.trim() || 'N/A',
                        Verify: parts[3]?.trim() || 'N/A',
                        DeviceSN: req.query.SN || 'Unknown'
                    };
                    logEvent("📥 Attendance Record", attendanceData);
                }
            }
        });
        return res.send("OK");
    }

    // Handle JSON format
    if (typeof body === 'object') {
        // Attendance log with user data
        if (body.table === "ATTLOG" || body.attlog || body.Record) {
            const attendanceData = {
                UserID: body.PIN || body.UserID || body.pin || body.user_id || 'N/A',
                DateTime: body.DateTime || body.time || body.date || 'N/A',
                Status: body.Status || body.status || 'N/A',
                Verify: body.Verify || body.verify || 'N/A',
                DeviceSN: body.SN || req.query.SN || 'Unknown'
            };
            logEvent("📥 Attendance Record", attendanceData);
        }
        // Operation log
        else if (body.table === "OPERLOG") {
            logEvent("⚙️ Operation Log", body);
        }
        // User event
        else if (body.table === "USER") {
            logEvent("👤 User Event", body);
        }
        // Device info (suppress or minimize)
        else if (body.SN && !body.PIN && !body.UserID) {
            // Just device info, not attendance - suppress
            console.log(`✓ Device info from ${body.SN}`);
        }
        // Unknown format - log raw for debugging
        else {
            logEvent("📦 Raw Data Received", body);
        }
    }

    res.send("OK");
});

// ---------- DEVICE REGISTRATION ----------
app.get("/iclock/registry", (req, res) => {
    console.log(`📝 Device Registration (GET) from ${req.query.SN || 'unknown'}`);
    res.send("OK");
});

app.post("/iclock/registry", (req, res) => {
    logEvent("📝 Device Registration (POST)", {
        body: req.body,
        query: req.query
    });
    res.send("OK");
});

// ---------- PUSH LOGS ----------
app.post("/iclock/push", (req, res) => {
    logEvent("🔥 PUSH Trigger Received", req.body);
    res.send("OK");
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
    console.log(`\n🚀 Push Server Running on PORT ${PORT}`);
    console.log("Waiting for device events...\n");
    console.log("⚠️  IMPORTANT: If you're not receiving attendance data:");
    console.log("   1. Go to device menu: Menu > System > Device Type Setting");
    console.log("   2. Change Device Type from 'A&C PUSH' to 'T&A PUSH'");
    console.log("   3. Restart the device");
    console.log("   4. Configure Push Server IP and Port in device settings\n");
});
