// Attendance Management System with Face Recognition Device Integration
// Node.js - Express - MongoDB - EJS

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const path = require("path");

const app = express();
const PORT = 8090;

// Import Models
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");

// MongoDB Connection
mongoose.connect("mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/attendance_dbFacerego2?retryWrites=true&w=majority&appName=Cluster0", {

})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware Configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/plain', limit: '10mb' }));
app.use(methodOverride("_method"));

// Middleware to log POST requests from device
app.use((req, res, next) => {
    if (req.method === 'POST' && req.path.includes('/iclock/')) {
        console.log(`\n📨 ${req.method} ${req.path} - Content-Type: ${req.headers['content-type'] || 'none'}`);
    }
    next();
});

// ---------- UTILITY FUNCTIONS ----------
function logEvent(title, data) {
    console.log("\n==============================");
    console.log("📌 " + title);
    console.log("==============================");
    console.log(JSON.stringify(data, null, 2));
    console.log("==============================\n");
}

// Generate random 4-digit ID
function generateStudentId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Process attendance from device
async function processAttendance(attendanceData) {
    try {
        const { UserID, DateTime, Status, Verify, DeviceSN } = attendanceData;
        
        // Find student by ID
        const student = await Student.findOne({ studentId: UserID });
        
        if (!student) {
            console.log(`⚠️ Student with ID ${UserID} not found in database`);
            return;
        }

        // Create attendance record
        const attendance = new Attendance({
            studentId: UserID,
            studentName: student.name,
            dateTime: new Date(DateTime) || new Date(),
            status: Status || 'Present',
            verifyMethod: Verify || 'Face Recognition',
            deviceSN: DeviceSN || 'Unknown'
        });

        await attendance.save();
        console.log(`✅ Attendance recorded for ${student.name} (ID: ${UserID})`);
        logEvent("📝 Attendance Saved", {
            student: student.name,
            id: UserID,
            time: attendance.dateTime,
            method: Verify
        });
    } catch (error) {
        console.error("❌ Error processing attendance:", error);
    }
}

// ---------- WEB ROUTES ----------

// Home Page - Dashboard
app.get("/", async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const todayAttendance = await Attendance.countDocuments({
            dateTime: { $gte: todayStart, $lte: todayEnd }
        });

        const recentAttendance = await Attendance.find()
            .sort({ dateTime: -1 })
            .limit(10);

        res.render("index", {
            title: "Dashboard",
            totalStudents,
            todayAttendance,
            recentAttendance
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Students List Page
app.get("/students", async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.render("students", {
            title: "Students",
            students
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Add Student Page
app.get("/students/add", (req, res) => {
    res.render("add-student", {
        title: "Add Student",
        error: null
    });
});

// Add Student - POST
app.post("/students/add", async (req, res) => {
    try {
        let studentId;
        let isUnique = false;
        
        // Generate unique 4-digit ID
        while (!isUnique) {
            studentId = generateStudentId();
            const existing = await Student.findOne({ studentId });
            if (!existing) isUnique = true;
        }

        const student = new Student({
            studentId,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            department: req.body.department
        });

        await student.save();
        console.log(`✅ New student added: ${student.name} (ID: ${studentId})`);
        res.redirect(`/students/success/${studentId}`);
    } catch (error) {
        console.error(error);
        res.render("add-student", {
            title: "Add Student",
            error: "Error adding student. Please try again."
        });
    }
});

// Student Added Success Page
app.get("/students/success/:id", async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });
        if (!student) {
            return res.redirect("/students");
        }
        res.render("student-success", {
            title: "Student Added",
            student
        });
    } catch (error) {
        console.error(error);
        res.redirect("/students");
    }
});

// Delete Student
app.delete("/students/:id", async (req, res) => {
    try {
        await Student.findOneAndDelete({ studentId: req.params.id });
        await Attendance.deleteMany({ studentId: req.params.id });
        res.redirect("/students");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Attendance Records Page
app.get("/attendance", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        const totalRecords = await Attendance.countDocuments();
        const totalPages = Math.ceil(totalRecords / limit);

        const attendanceRecords = await Attendance.find()
            .sort({ dateTime: -1 })
            .skip(skip)
            .limit(limit);

        res.render("attendance", {
            title: "Attendance Records",
            attendanceRecords,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Search Attendance by Student ID
app.get("/attendance/search", async (req, res) => {
    try {
        const { studentId, date } = req.query;
        let query = {};

        if (studentId) {
            query.studentId = studentId;
        }

        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);
            query.dateTime = { $gte: searchDate, $lt: nextDay };
        }

        const attendanceRecords = await Attendance.find(query)
            .sort({ dateTime: -1 });

        res.render("attendance", {
            title: "Attendance Records",
            attendanceRecords,
            currentPage: 1,
            totalPages: 1,
            searchQuery: req.query
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// ---------- DEVICE INTEGRATION ROUTES ----------

// Device Ping (Test if server is alive)
app.get("/iclock/cdata", (req, res) => {
    const deviceSN = req.query.SN || 'unknown';
    const deviceType = req.query.DeviceType || 'unknown';
    
    if (deviceType === 'acc') {
        console.log(`⚠️ Device ${deviceSN} is in ACCESS CONTROL mode - needs T&A PUSH mode for attendance`);
    } else {
        console.log(`✓ Device ping from ${deviceSN} (Type: ${deviceType})`);
    }
    
    return res.send("OK");
});

// Push Attendance Receiver from Device
app.post("/iclock/cdata", async (req, res) => {
    console.log("\n🔍 POST /iclock/cdata received");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Query params:", req.query);
    console.log("Body type:", typeof req.body);
    
    const body = req.body;
    console.log(body);
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
        console.log("⚠️ Empty body received - device may not be configured for push");
        return res.send("OK");
    }

    // Handle text/CSV format (common ZKTeco format: PIN,DateTime,Status,Verify)
    if (typeof body === 'string' && body.includes(',')) {
        const lines = body.trim().split('\n');
        for (const line of lines) {
            console.log(line);
            if (line.trim()) {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const attendanceData = {
                        UserID: parts[0]?.trim(),
                        DateTime: parts[1]?.trim(),
                        Status: parts[2]?.trim() || 'Present',
                        Verify: parts[3]?.trim() || 'Face Recognition',
                        DeviceSN: req.query.SN || 'Unknown'
                    };
                    await processAttendance(attendanceData);
                }
            }
        }
        return res.send("OK");
    }

    // Handle JSON format
    if (typeof body === 'object') {
        if (body.table === "ATTLOG" || body.attlog || body.Record || body.PIN || body.UserID) {
            const attendanceData = {
                UserID: body.PIN || body.UserID || body.pin || body.user_id || 'N/A',
                DateTime: body.DateTime || body.time || body.date || new Date().toISOString(),
                Status: body.Status || body.status || 'Present',
                Verify: body.Verify || body.verify || 'Face Recognition',
                DeviceSN: body.SN || req.query.SN || 'Unknown'
            };
            await processAttendance(attendanceData);
        } else if (body.table === "OPERLOG") {
            logEvent("⚙️ Operation Log", body);
        } else if (body.table === "USER") {
            logEvent("👤 User Event", body);
        } else if (body.SN && !body.PIN && !body.UserID) {
            console.log(`✓ Device info from ${body.SN}`);
        } else {
            logEvent("📦 Raw Data Received", body);
        }
    }

    res.send("OK");
});

// Device Registration
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

// Push Logs
app.post("/iclock/push", (req, res) => {
    logEvent("🔥 PUSH Trigger Received", req.body);
    res.send("OK");
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
    console.log(`\n🚀 Attendance Management System Running on PORT ${PORT}`);
    console.log(`📱 Web Interface: http://localhost:${PORT}`);
    console.log(`🔌 Device Push Endpoint: http://YOUR_IP:${PORT}/iclock/cdata`);
    console.log("\nWaiting for device events and web requests...\n");
    console.log("⚠️  DEVICE SETUP:");
    console.log("   1. Add students via web interface");
    console.log("   2. Note the 4-digit ID generated");
    console.log("   3. Add this ID to your face recognition device manually");
    console.log("   4. Configure device: Menu > System > Device Type = 'T&A PUSH'");
    console.log("   5. Set Push Server IP and Port in device settings\n");
});
