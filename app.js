// server.js
const express = require('express');

const app = express();
app.use(express.text({ type: '*/*' }));  // the device posts plain-text, not JSON

app.post(['/iclock/cdata'], (req, res) => {
  const sn = req.query.SN;
  const table = req.query.table;
  const c = req.query.c;

  if (table === 'ATTLOG' && c === 'log' && req.body) {
    const lines = req.body.trim().split(/\\r?\\n/);
    for (const l of lines) {
      const logLine = `[${new Date().toISOString()}] SN=${sn} DATA=${l}\\n`;
      console.log(logLine);
    }
    return res.send('OK');
  }

  // you may implement USER data, PHOTO uploads, etc. as needed
  res.send('OK');
});

const PORT =  8090;
app.listen(PORT, () => {
  console.log(`ADMS listener running on port ${PORT}`);
});
