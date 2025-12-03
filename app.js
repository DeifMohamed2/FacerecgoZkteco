// Simple ZKTeco Push Handler (Works with devices WITHOUT URL path field)
// Run: node app.js
// Install: npm install express body-parser

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Function to handle PUSH data
function handlePush(req, res) {
  const data = req.body;

  // Attendance log example fields:
  // table = "ATTLOG", pin = user ID, name = user name, time = timestamp, status 0/1
  if (data.table === 'ATTLOG') {
    console.log('--- Attendance Event ---');
    console.log('User ID:', data.pin);
    console.log('Name:', data.name || 'Not sent by device');
    console.log('Time:', data.time);

    if (data.status === '0') console.log('Event: Check-In');
    if (data.status === '1') console.log('Event: Check-Out');

    console.log('------------------------');
  }

  res.send('OK');
}

// Device may POST to "/" OR "/iclock/cdata"
app.post('/', handlePush);
app.post('/iclock/cdata', handlePush);

app.get('/', (req, res) => res.send('ZKTeco Push Server Running'));

const PORT = 8090; // Use the same port you set in the device
app.listen(PORT, () => {
  console.log(`Listening for ZKTeco PUSH on port ${PORT}`);
});
