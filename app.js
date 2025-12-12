// ============================================================================
// ZKTeco SenseFace 2A ADMS Professional Node.js Server  (Single File Version)
// ============================================================================

const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const PORT = 8090;

// ============================================================================
// UNIVERSAL PARSER  (Key=Value)
// ============================================================================
function parseKeyValue(payload = "") {
    const data = {};
    const parts = payload.split(/[,~\t\r\n]+/);

    parts.forEach(pair => {
        const [key, value] = pair.split("=");
        if (key && value !== undefined) data[key.trim()] = value.trim();
    });

    return data;
}

// ============================================================================
// MODELS (Structured Data)
// ============================================================================
class AttendanceLog {
    constructor(raw, sn) {
        this.deviceSN = sn;
        this.userPin = raw.PIN || null;
        this.timestamp = raw.Time || null;
        this.verifyMode = raw.Verify || raw.Verified || null;
        this.status = raw.Status || null;

        this.raw = raw;
    }
}

class DeviceInfo {
    constructor(raw, sn) {
        this.sn = sn;
        this.deviceName = raw.DeviceName || null;
        this.model = raw.MachineType || null;
        this.firmware = raw.FirmVer || null;
        this.pushVersion = raw.PushVersion || null;
        this.ipAddress = raw.IPAddress || null;
        this.maxUsers = raw.MaxUserCount || null;
        this.maxLogs = raw.MaxAttLogCount || null;

        this.raw = raw;
    }
}

// ============================================================================
// ADMS PROTOCOL HANDLERS
// ============================================================================

// Handshake creation
function createHandshakeResponse(sn) {
    return [
        `GET OPTION FROM: ${sn}`,
        "ATTLOGStamp=0",
        "OPERLOGStamp=0",
        "Delay=2",
        "TransTimes=00:00;23:59",
        "TransInterval=1",
        "Realtime=1",
        "Encrypt=0",
        "OK"
    ].join("\r\n");
}

// Handle handshake
function handleHandshake(req, res) {
    const sn = req.query.SN;
    console.log(`🤝 Handshake Received From: ${sn}`);

    res.set("Content-Type", "text/plain");
    res.send(createHandshakeResponse(sn));
}

// Handle device registry info
function handleRegistry(req, res) {
    const sn = req.query.SN;
    const parsed = parseKeyValue(req.body);

    const device = new DeviceInfo(parsed, sn);

    console.log("\n📟 DEVICE REGISTRY:");
    console.log(JSON.stringify(device, null, 2));

    res.send("OK");
}

// Handle attendance push
function handleAttendance(req, res) {
    const sn = req.query.SN;
    const table = req.query.table;

    console.log("\n📩 RAW ATTENDANCE PAYLOAD:");
    console.log(req.body);

    if (table !== "ATTLOG") {
        console.log("⚠️ Not ATTLOG, Ignored.");
        return res.send("OK");
    }

    const parsed = parseKeyValue(req.body);
    const log = new AttendanceLog(parsed, sn);

    console.log("\n🧾 FORMATTED ATTENDANCE LOG:");
    console.log(JSON.stringify(log, null, 2));

    // TODO: save to DB

    res.send("OK");
}

// Handle device command polling
function handleCommandPolling(req, res) {
    res.send("OK");
}

// ============================================================================
// MIDDLEWARE + ROUTES
// ============================================================================
app.use(bodyParser.text({ type: "*/*" }));

app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] → ${req.method} ${req.url}`);
    next();
});

// ROUTES
app.get("/iclock/cdata", handleHandshake);
app.get("/iclock/cdata.aspx", handleHandshake);

app.post("/iclock/registry", handleRegistry);

app.post("/iclock/cdata", handleAttendance);

app.get("/iclock/getrequest", handleCommandPolling);

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, "0.0.0.0", () => {
    console.log("============================================================");
    console.log(`🚀 ZKTeco ADMS Server Running on Port ${PORT}`);
    console.log("📡 Waiting for SenseFace 2A Logs...");
    console.log("============================================================");
});
