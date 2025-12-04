// app.js - Simple ADMS Push Server for ZKTeco SenseFace 2A

const express = require("express");
const app = express();
const PORT = 8090;

// Device sends URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Basic test route to confirm server is running
app.get("/", (req, res) => {
  res.send("ZKTeco ADMS Push Server is Running");
});

app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});


// Device Test Connection (GET request)
app.get("/iclock/cdata", (req, res) => {
  console.log("📡 Device Pinged Server (GET)");
  res.send("OK");
});

// Device Sends Attendance / Events (POST request)
app.post("/iclock/cdata", (req, res) => {
  console.log("===== 📥 NEW PUSH DATA RECEIVED =====");
  console.log(req.body);

  // Save each event to a log file
    console.log(req.body);
  // MUST respond with OK or device retries
  res.send("OK");
});

// Catch-all route for any unmatched requests
app.use((req, res) => {
  console.log("UNKNOWN PUSH:", req.method, req.url, req.body);
  res.send("OK");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 ZKTeco ADMS Push Server running on port ${PORT}`);
});
