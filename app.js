// =======================================================================================
//  ZKTeco SenseFace 2A ADMS Professional Server - Single File Edition
//  Author: ChatGPT
//  File: app.js
// =======================================================================================

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8090;

// =======================================================================================
// 1) UNIVERSAL PARSER (Key=Value pairs)
// =======================================================================================
function parseKeyValuePayload(payload = "") {
    const data = {};
    const pairs = payload.split(/[,~\t\r\n]+/);

    pairs.forEach(pair => {
        const [key, value] = pair.split("=");
        if (key && value !== undefined) data[key.trim()] = value.trim();
    });

    return data;
}

function parseAttendance(payload) {
    return parseKeyValuePayload(payload);
}

function parseRegistry(payload) {
    return parseKeyValuePayload(payload);
}

// =======================================================================================
// 2) MODELS (Structured Data Objects)
// =======================================================================================

class AttendanceLog {
    constructor(raw, sn) {
        this.deviceSN = sn || null;
        this.userPin = raw.PIN || null;
        this.timestamp = raw.Time || null;
        this.verifyMode = raw.Verified || raw.Verify || null;
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

// =======================================================================================
// 3) ADMS HANDLERS
// =======================================================================================

// Handshake response
function buildHandshakeResponse(sn) {
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

function handleHandshake(req, res) {
    const sn = req.query.SN;
    console.log(`🤝 Handshake received from SN=${sn}`);

    const response = buildHandshakeResponse(sn);
    res.set("Content-Type", "text/plain");
    res.send(response);
}

function handleRegistry(req, res) {
    const sn = req.query.SN;
    const parsed = parseRegistry(req.body);
    const device = new DeviceInfo(parsed, sn);

    console.log("\n📟 DEVICE REGISTRY RECEIVED:");
    console.log(JSON.stringify(device, null, 2));

    res.send("OK");
}

function handleAttendance(req, res) {
    const sn = req.query.SN;
    const table = req.query.table;

    if (table !== "ATTLOG") {
        console.log(`⚠️ Unknown table '${table}', ignoring.`);
        return res.send("OK");
    }

    const parsed = parseAttendance(req.body);
    const log = new AttendanceLog(parsed, sn);

    console.log("\n🧾 NEW ATTENDANCE RECORD:");
    console.log(JSON.stringify(log, null, 2));

    // TODO: Save to database later

    res.send("OK");
}

function handleCommandPolling(req, res) {
    res.send("OK");
}

// =======================================================================================
// 4) MIDDLEWARE + ROUTES
// =======================================================================================

app.use(bodyParser.text({ type: "*/*" }));

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] → ${req.method} ${req.url}`);
    next();
});

// Handshake
app.get("/iclock/cdata", handleHandshake);
app.get("/iclock/cdata.aspx", handleHandshake);

// Device registry
app.post("/iclock/registry", handleRegistry);

// Attendance log push
app.post("/iclock/cdata", handleAttendance);

// Command polling
app.get("/iclock/getrequest", handleCommandPolling);

// =======================================================================================
// 5) START SERVER
// =======================================================================================

app.listen(PORT, "0.0.0.0", () => {
    console.log("===========================================================");
    console.log(`🚀 ZKTeco ADMS Server running on port ${PORT}`);
    console.log("Waiting for SenseFace 2A device logs...");
    console.log("===========================================================");
});
