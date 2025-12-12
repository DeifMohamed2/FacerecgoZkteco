// SensFace 2A / ZKTeco Push Protocol Server
// Node.js - Express

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8090; // <-- Your open firewall port

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
    logEvent("Device connected (GET /cdata)", req.query);
    return res.send("OK");
});

// ---------- PUSH ATTENDANCE RECEIVER ----------
app.post("/iclock/cdata", (req, res) => {
    const body = req.body;

    if (!body) {
        return res.send("OK");
    }

    // Different event types
    if (body.SN) {
        logEvent("Device Info", body);
    }

    if (body.table === "ATTLOG" || body.attlog) {
        logEvent("📥 Attendance Log Received", body);
    }

    if (body.table === "OPERLOG") {
        logEvent("⚙️ Operation Log Received", body);
    }

    if (body.table === "USER") {
        logEvent("👤 User Event Received", body);
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
