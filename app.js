// ============================================================================
//  SenseFace 2A — FULL RAW ADMS SERVER (Single File Version)
//  Includes: Handshake + Registry + Attendance + Full Logging
// ============================================================================

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8090;

// ============================================================================
// PARSER — Universal key=value parser
// ============================================================================
function parseKeyValue(payload = "") {
    const data = {};
    const parts = payload.split(/[,~\t\r\n]+/);

    for (let pair of parts) {
        const [key, value] = pair.split("=");
        if (key && value !== undefined) data[key.trim()] = value.trim();
    }

    return data;
}

// ============================================================================
// MODELS (Structured Output)
// ============================================================================
class AttendanceLog {
    constructor(raw, sn) {
        this.deviceSN = sn;
        this.raw = raw;

        this.userPin = raw.PIN || null;
        this.timestamp = raw.Time || null;
        this.verifyMode = raw.Verify || raw.Verified || null;
        this.status = raw.Status || null;
    }
}

class DeviceInfo {
    constructor(raw, sn) {
        this.sn = sn;
        this.raw = raw;

        this.deviceName = raw.DeviceName || null;
        this.model = raw.MachineType || null;
        this.firmware = raw.FirmVer || null;
        this.pushVersion = raw.PushVersion || null;
        this.ipAddress = raw.IPAddress || null;
    }
}

// ============================================================================
// HANDSHAKE RESPONSE
// ============================================================================
function createHandshakeResponse(sn) {
    return [
        `GET OPTION FROM: ${sn}`,
        "ATTLOGStamp=0",
        "OPERLOGStamp=0",
        "Delay=1",
        "TransTimes=00:00;23:59",
        "TransInterval=1",
        "Realtime=1",
        "Encrypt=0",
        "OK"
    ].join("\r\n");
}

// ============================================================================
// HANDLERS
// ============================================================================

// HANDSHAKE
function handleHandshake(req, res) {
    const sn = req.query.SN || "UNKNOWN";

    console.log("\n=================== 🤝 HANDSHAKE ===================");
    console.log("➡ QUERY:", req.query);

    res.set("Content-Type", "text/plain");
    res.send(createHandshakeResponse(sn));
}

// REGISTRY / DEVICE INFO
function handleRegistry(req, res) {
    const sn = req.query.SN;
    const parsed = parseKeyValue(req.body);

    const device = new DeviceInfo(parsed, sn);

    console.log("\n=================== 📟 DEVICE REGISTRY ===================");
    console.log("➡ QUERY:", req.query);
    console.log("➡ RAW BODY:", req.body);
    console.log("➡ PARSED DEVICE INFO:", JSON.stringify(device, null, 2));

    res.send("OK");
}

// ATTENDANCE LOG
function handleAttendance(req, res) {
    console.log("\n=================== 🧾 ATTENDANCE DATA ===================");
    console.log("➡ QUERY:", req.query);
    console.log("➡ RAW BODY:", req.body);

    if (!req.body || req.body.trim() === "") {
        console.log("⚠️ Device sent EMPTY attendance body.");
        return res.send("OK");
    }

    const parsed = parseKeyValue(req.body);
    const sn = req.query.SN;

    const log = new AttendanceLog(parsed, sn);

    console.log("➡ PARSED ATTENDANCE LOG:", JSON.stringify(log, null, 2));

    // TODO: save to DB
    res.send("OK");
}

// COMMAND POLLING
function handleGetCommand(req, res) {
    res.send("OK");
}

// ============================================================================
// MIDDLEWARE + ROUTES
// ============================================================================
app.use(bodyParser.text({ type: "*/*" }));

// Global Request Logger
app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] → ${req.method} ${req.url}`);
    next();
});

// Routes
app.get("/iclock/cdata", handleHandshake);
app.get("/iclock/cdata.aspx", handleHandshake);

app.post("/iclock/registry", handleRegistry);

app.post("/iclock/cdata", handleAttendance);

app.get("/iclock/getrequest", handleGetCommand);

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, "0.0.0.0", () => {
    console.log("===========================================================");
    console.log(`🚀 ADMS Server running on port ${PORT}`);
    console.log("📡 Waiting for SenseFace 2A attendance logs...");
    console.log("===========================================================");
});
