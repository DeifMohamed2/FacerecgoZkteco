# Attendance System with SensFace 2A Devices

A full-featured attendance management system built with Node.js, Express, EJS, and MongoDB for managing SensFace 2A (ZKTeco) biometric devices.

## Features

- ✅ **Add Students** - Automatically generates 4-digit random student IDs
- ✅ **Real-time Device Status** - Monitor connected devices without storing in database
- ✅ **Automatic Student Sync** - Adds students to all connected devices via HTTP API
- ✅ **Attendance Tracking** - Receives and saves attendance records from devices
- ✅ **Web Dashboard** - Beautiful UI with real-time updates
- ✅ **MongoDB Storage** - Persistent storage for students and attendance records

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (running locally on port 27017)
3. **SensFace 2A Device** (configured for T&A PUSH mode)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# Or run manually
mongod
```

3. Configure your devices in `config/devices.js`:
```javascript
const devices = [
    {
        name: 'Device 1',
        ip: '192.168.1.201',  // Your device IP
        port: 80,
        username: 'admin',
        password: 'admin',
        sn: ''
    }
];
```

## Running the Application

```bash
npm start
```

The application will start on:
- **Web Interface**: http://localhost:8090
- **Push Endpoint**: http://localhost:8090/iclock/cdata

## Device Configuration

### 1. Set Device to T&A PUSH Mode

1. On the device screen, go to: **Menu > System > Device Type Setting**
2. Change from "A&C PUSH" to **"T&A PUSH"**
3. Restart the device

### 2. Configure Push Server

1. Go to: **Menu > System > Communication**
2. Set **Push Server IP**: Your server's IP address (e.g., `192.168.1.100`)
3. Set **Push Server Port**: `8090`
4. Save and restart the device

## Usage

### Adding a Student

1. Navigate to **Add Student** page
2. Fill in student information (Name is required)
3. Click **Add Student**
4. The system will:
   - Generate a unique 4-digit student ID
   - Save student to MongoDB
   - Automatically add student to all connected devices
   - Show device sync status

### Viewing Attendance

1. Navigate to **Attendance Records** page
2. View all attendance records
3. Filter by:
   - Student ID
   - Date range
4. Records auto-refresh every 30 seconds

### Dashboard

- View total students count
- View today's attendance count
- Monitor device connection status in real-time
- Device status updates every 10 seconds

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students/add` - Add new student
- `DELETE /api/students/:id` - Delete student

### Attendance
- `GET /api/attendance` - Get attendance records (with pagination)
- `GET /api/attendance/stats` - Get attendance statistics

### Devices
- `GET /api/devices/status` - Get device status
- `POST /api/devices/check/:ip` - Check device connection
- `POST /api/devices/add` - Add new device

### Device Push Endpoints
- `GET /iclock/cdata` - Device ping
- `POST /iclock/cdata` - Receive attendance data
- `GET /iclock/registry` - Device registration
- `POST /iclock/registry` - Device registration

## Project Structure

```
Facerecgo/
├── app.js                 # Main application file
├── config/
│   ├── database.js        # MongoDB connection
│   └── devices.js         # Device configuration
├── models/
│   ├── Student.js         # Student model
│   └── Attendance.js      # Attendance model
├── routes/
│   ├── studentRoutes.js   # Student routes
│   ├── attendanceRoutes.js # Attendance routes
│   └── deviceRoutes.js    # Device routes
├── views/
│   ├── dashboard.ejs      # Dashboard page
│   ├── add-student.ejs    # Add student page
│   ├── attendance.ejs     # Attendance records page
│   └── partials/
│       ├── header.ejs     # Header partial
│       └── footer.ejs     # Footer partial
└── package.json
```

## Important Notes

1. **Device Connection**: Devices are tracked in real-time (in-memory), not stored in database
2. **Student ID**: Automatically generated 4-digit random IDs (1000-9999)
3. **Duplicate Prevention**: System prevents duplicate attendance records
4. **Unknown Students**: Attendance from unknown student IDs is still saved with "Unknown" name
5. **Device Sync**: Students are only added to devices that are currently connected

## Troubleshooting

### Device Not Connecting
- Check device IP address in `config/devices.js`
- Verify device is on the same network
- Check device username/password
- Ensure device is in T&A PUSH mode

### Attendance Not Received
- Verify device push server configuration
- Check firewall settings (port 8090)
- Ensure device is in T&A PUSH mode (not A&C PUSH)
- Check server logs for errors

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MongoDB is on default port 27017
- Verify database name in `config/database.js`

## License

MIT

