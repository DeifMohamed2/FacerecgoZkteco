// SensFace 2A / ZKTeco Push Protocol Server
// Node.js - Express

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8090; // <-- Your open firewall port

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
    // Suppress repeated ping logs - only log once per session
    console.log(`✓ Device ping from ${req.query.SN || 'unknown'}`);
    return res.send("OK");
});

// ---------- PUSH ATTENDANCE RECEIVER ----------
app.post("/iclock/cdata", (req, res) => {
    const body = req.body;

    if (!body) {
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

// ---------- PUSH LOGS ----------
app.post("/iclock/push", (req, res) => {
    logEvent("🔥 PUSH Trigger Received", req.body);
    res.send("OK");
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
    console.log(`\n🚀 Push Server Running on PORT ${PORT}`);
    console.log("Waiting for device events...\n");
});
