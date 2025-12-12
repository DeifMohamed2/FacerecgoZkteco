// SensFace 2A / ZKTeco Attendance System
// Full Application with EJS, Express, MongoDB

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const connectDB = require("./config/database");
const { deviceStatus } = require("./config/devices");
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");

// Import routes
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const deviceRoutes = require("./routes/deviceRoutes");

const app = express();
const PORT = 8090;

// Connect to MongoDB
connectDB();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/plain', limit: '10mb' }));
app.use(express.static(path.join(__dirname, "public")));

// Logging middleware
app.use((req, res, next) => {
    if (req.method === 'POST' && req.path.includes('iclock')) {
        console.log(`\n📨 ${req.method} ${req.path} - Content-Type: ${req.headers['content-type'] || 'none'}`);
    }
    next();
});

// ---------- ROUTES ----------

// Home/Dashboard
app.get("/", async (req, res) => {
    res.render("dashboard");
});

// Add Student Page
app.get("/add-student", (req, res) => {
    res.render("add-student");
});

// Attendance Records Page
app.get("/attendance", (req, res) => {
    res.render("attendance");
});

// API Routes
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/devices", deviceRoutes);

// ---------- DEVICE PUSH RECEIVER ----------

// Device ping (test if server is alive)
app.get("/iclock/cdata", (req, res) => {
    const deviceSN = req.query.SN || 'unknown';
    const deviceType = req.query.DeviceType || 'unknown';
    
    // Update device status
    updateDeviceConnection(deviceSN, true);
    
    if (deviceType === 'acc') {
        console.log(`⚠️ Device ${deviceSN} is in ACCESS CONTROL mode - needs T&A PUSH mode for attendance`);
    } else {
        console.log(`✓ Device ping from ${deviceSN} (Type: ${deviceType})`);
    }
    
    return res.send("OK");
});

// Push attendance receiver
app.post("/iclock/cdata", async (req, res) => {
    const deviceSN = req.query.SN || 'unknown';
    
    // Update device connection status
    updateDeviceConnection(deviceSN, true);
    
    const body = req.body;

    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
        console.log("⚠️ Empty body received - device may not be configured for push");
        return res.send("OK");
    }

    try {
        // Handle text/CSV format (common ZKTeco format: PIN,DateTime,Status,Verify)
        if (typeof body === 'string' && body.includes(',')) {
            const lines = body.trim().split('\n');
            
            for (const line of lines) {
                if (line.trim()) {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        await saveAttendanceRecord({
                            UserID: parts[0]?.trim(),
                            DateTime: parts[1]?.trim(),
                            Status: parts[2]?.trim() || 'Check In',
                            Verify: parts[3]?.trim() || 'Unknown',
                            DeviceSN: deviceSN
                        });
                    }
                }
            }
            return res.send("OK");
        }

        // Handle JSON format
        if (typeof body === 'object') {
            // Attendance log
            if (body.table === "ATTLOG" || body.attlog || body.Record || body.PIN || body.UserID || body.user_id) {
                await saveAttendanceRecord({
                    UserID: body.PIN || body.UserID || body.pin || body.user_id || 'N/A',
                    DateTime: body.DateTime || body.time || body.date || new Date().toISOString(),
                    Status: body.Status || body.status || 'Check In',
                    Verify: body.Verify || body.verify || body.verify_mode || 'Unknown',
                    DeviceSN: deviceSN
                });
            }
            // Operation log
            else if (body.table === "OPERLOG") {
                console.log("⚙️ Operation Log:", body);
            }
            // User event
            else if (body.table === "USER") {
                console.log("👤 User Event:", body);
            }
            // Device info
            else if (body.SN && !body.PIN && !body.UserID) {
                console.log(`✓ Device info from ${body.SN}`);
            }
            // Unknown format
            else {
                console.log("📦 Raw Data Received:", body);
            }
        }
    } catch (error) {
        console.error("❌ Error processing attendance:", error);
    }

    res.send("OK");
});

// Device registration
app.get("/iclock/registry", (req, res) => {
    const deviceSN = req.query.SN || 'unknown';
    updateDeviceConnection(deviceSN, true);
    console.log(`📝 Device Registration (GET) from ${deviceSN}`);
    res.send("OK");
});

app.post("/iclock/registry", (req, res) => {
    const deviceSN = req.query.SN || req.body.SN || 'unknown';
    updateDeviceConnection(deviceSN, true);
    console.log(`📝 Device Registration (POST) from ${deviceSN}`);
    res.send("OK");
});

// Push logs
app.post("/iclock/push", (req, res) => {
    const deviceSN = req.query.SN || req.body.SN || 'unknown';
    updateDeviceConnection(deviceSN, true);
    console.log(`🔥 PUSH Trigger Received from ${deviceSN}`);
    res.send("OK");
});

// ---------- HELPER FUNCTIONS ----------

// Update device connection status
function updateDeviceConnection(deviceSN, connected) {
    // Find device by SN or IP
    for (const [ip, device] of deviceStatus.entries()) {
        if (device.sn === deviceSN || !device.sn) {
            deviceStatus.set(ip, {
                ...device,
                connected: connected,
                lastSeen: new Date(),
                status: connected ? 'Connected' : 'Disconnected',
                sn: deviceSN !== 'unknown' ? deviceSN : device.sn
            });
            break;
        }
    }
}

// Save attendance record to MongoDB
async function saveAttendanceRecord(data) {
    try {
        const { UserID, DateTime, Status, Verify, DeviceSN } = data;

        if (!UserID || UserID === 'N/A') {
            console.log("⚠️ Skipping attendance record - no UserID");
            return;
        }

        // Find student by ID
        const student = await Student.findOne({ studentId: UserID });

        if (!student) {
            console.log(`⚠️ Student with ID ${UserID} not found in database`);
            // Still save the record with the ID
            const attendance = new Attendance({
                studentId: UserID,
                studentName: `Unknown (${UserID})`,
                deviceSN: DeviceSN,
                dateTime: parseDateTime(DateTime),
                status: Status,
                verifyMode: Verify,
                rawData: data
            });
            await attendance.save();
            console.log(`📥 Attendance saved (Unknown Student): ${UserID} at ${DateTime}`);
            return;
        }

        // Check if record already exists (prevent duplicates)
        const existingRecord = await Attendance.findOne({
            studentId: UserID,
            dateTime: parseDateTime(DateTime),
            deviceSN: DeviceSN
        });

        if (existingRecord) {
            console.log(`⚠️ Duplicate attendance record skipped: ${UserID} at ${DateTime}`);
            return;
        }

        // Create attendance record
        const attendance = new Attendance({
            studentId: student.studentId,
            studentName: student.name,
            deviceSN: DeviceSN,
            dateTime: parseDateTime(DateTime),
            status: Status,
            verifyMode: Verify,
            rawData: data
        });

        await attendance.save();
        console.log(`✅ Attendance saved: ${student.name} (${UserID}) at ${DateTime} - ${Status}`);
    } catch (error) {
        console.error("❌ Error saving attendance:", error);
    }
}

// Parse date time from various formats
function parseDateTime(dateTimeString) {
    if (!dateTimeString) {
        return new Date();
    }

    // Try parsing common formats
    // Format: "2025-12-12 21:40:10" or "2025/12/12 21:40:10"
    const formats = [
        /(\d{4})[-\/](\d{2})[-\/](\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
        /(\d{2})[-\/](\d{2})[-\/](\d{4})\s+(\d{2}):(\d{2}):(\d{2})/,
    ];

    for (const format of formats) {
        const match = dateTimeString.match(format);
        if (match) {
            if (match[1].length === 4) {
                // YYYY-MM-DD format
                return new Date(
                    parseInt(match[1]),
                    parseInt(match[2]) - 1,
                    parseInt(match[3]),
                    parseInt(match[4]),
                    parseInt(match[5]),
                    parseInt(match[6])
                );
            } else {
                // DD-MM-YYYY format
                return new Date(
                    parseInt(match[3]),
                    parseInt(match[2]) - 1,
                    parseInt(match[1]),
                    parseInt(match[4]),
                    parseInt(match[5]),
                    parseInt(match[6])
                );
            }
        }
    }

    // Fallback to Date constructor
    const date = new Date(dateTimeString);
    return isNaN(date.getTime()) ? new Date() : date;
}

// Periodic device status check
setInterval(async () => {
    const { devices } = require("./config/devices");
    const axios = require("axios");

    for (const device of devices) {
        try {
            const url = `http://${device.ip}:${device.port}/api/device/info`;
            await axios.get(url, {
                auth: {
                    username: device.username,
                    password: device.password
                },
                timeout: 2000
            });

            // Device is reachable
            const currentStatus = deviceStatus.get(device.ip);
            if (currentStatus && !currentStatus.connected) {
                deviceStatus.set(device.ip, {
                    ...currentStatus,
                    connected: true,
                    lastSeen: new Date(),
                    status: 'Connected'
                });
            }
        } catch (error) {
            // Device is not reachable
            const currentStatus = deviceStatus.get(device.ip);
            if (currentStatus && currentStatus.connected) {
                deviceStatus.set(device.ip, {
                    ...currentStatus,
                    connected: false,
                    status: 'Disconnected'
                });
            }
        }
    }
}, 30000); // Check every 30 seconds

// ---------- START SERVER ----------
app.listen(PORT, () => {
    console.log(`\n🚀 Attendance System Running on PORT ${PORT}`);
    console.log(`📱 Web Interface: http://localhost:${PORT}`);
    console.log(`📡 Push Endpoint: http://localhost:${PORT}/iclock/cdata`);
    console.log("\n⚠️  IMPORTANT: Configure your SensFace devices:");
    console.log("   1. Menu > System > Device Type Setting");
    console.log("   2. Change to 'T&A PUSH' mode");
    console.log("   3. Set Push Server IP: Your server IP");
    console.log("   4. Set Push Server Port: 8090");
    console.log("   5. Restart the device\n");
});
