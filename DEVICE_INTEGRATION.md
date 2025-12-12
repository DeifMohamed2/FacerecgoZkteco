# 🔌 Device Integration Guide

## Automatic User Push to SensFace 2A Device

This system now supports **automatic user creation** on your face recognition device!

---

## 🎯 How It Works

### The Complete Flow:

```
1. Add Student via Web Interface
   ↓
2. System generates 4-digit ID
   ↓
3. System automatically queues user data for all connected devices
   ↓
4. Device pings server (every ~1 minute)
   ↓
5. Server sends user data to device
   ↓
6. Device creates user with ID and Name
   ↓
7. You register biometric (face/fingerprint) on device
   ↓
8. Student can now use device for attendance
```

---

## ✨ Key Features

### Automatic Mode (Recommended)
- ✅ Add student via web interface
- ✅ User ID and name automatically sent to device
- ✅ You only need to register the biometric on device
- ✅ No manual ID entry needed!

### Manual Mode (Backup)
- Push specific users to specific devices
- Push all users to a device at once
- Useful for syncing or troubleshooting

---

## 📱 Setup Instructions

### 1. Configure Your Device

**Device Settings:**
- Menu → System → Device Type: **"T&A PUSH"**
- Menu → Comm → Push Server:
  - IP Address: Your server IP (e.g., 192.168.1.100)
  - Port: 8090
  - Push Interval: 1 minute

### 2. Verify Connection

1. Go to: http://localhost:8090/devices
2. You should see your device listed
3. Status should show "Online"

### 3. Add a Student

1. Go to: http://localhost:8090/students/add
2. Fill in student details
3. Click "Add Student"
4. Note the 4-digit ID generated (e.g., 5678)
5. **User data is automatically queued for the device!**

### 4. Register Biometric on Device

**Within 1 minute, the device will receive the user data:**

1. On the device, go to User Management
2. Find the user by ID (e.g., 5678)
3. The name should already be there!
4. Register the face or fingerprint
5. Done!

---

## 🔧 Device Management Page

Access: http://localhost:8090/devices

### Features:

**View Connected Devices:**
- See all devices that have connected
- Check online/offline status
- View pending commands queue

**Manual Push Options:**
- **Push User**: Send a specific student to a device
- **Push All**: Send all students to a device at once

**Use Cases:**
- Device was offline when student was added
- Need to resync all users
- Testing or troubleshooting

---

## 📡 Technical Details

### Command Format

The system sends commands using the ZKTeco protocol:

```
C:timestamp:DATA USER PIN=1234\tName=John Doe\tPri=0\tPasswd=\tCard=\tGrp=1\tTZ=0000000000000000
```

**Fields:**
- `PIN`: Student ID (4 digits)
- `Name`: Student name
- `Pri`: Privilege level (0 = user)
- `Passwd`: Password (empty)
- `Card`: RFID card number (empty)
- `Grp`: Group ID (1 = default)
- `TZ`: Time zone (all access)

### Communication Flow

**Device → Server (GET /iclock/cdata):**
- Device pings every ~1 minute
- Server checks for pending commands
- If commands exist, server responds with command
- If no commands, server responds with "OK"

**Device → Server (POST /iclock/cdata):**
- Device sends attendance records
- Server processes and stores in database

---

## 🎬 Step-by-Step Example

### Scenario: Add new student "John Doe"

**Step 1: Add Student**
```
Web Interface → Add Student
Name: John Doe
Email: john@example.com
Department: Computer Science
[Submit]
```

**Step 2: System Response**
```
✅ Student added with ID: 5678
📤 User data queued for device NYU7242801574
```

**Step 3: Device Receives Data (automatic)**
```
Device pings server...
Server responds: C:1234567890:DATA USER PIN=5678\tName=John Doe\t...
Device creates user 5678 with name "John Doe"
```

**Step 4: Register Biometric**
```
On Device:
- Go to User Management
- Find user 5678 (John Doe)
- Register Face
- Done!
```

**Step 5: Test Attendance**
```
John Doe uses device → Face recognized → 
Attendance sent to server → 
Recorded in database → 
Visible on dashboard
```

---

## 🔍 Troubleshooting

### User not appearing on device

**Check:**
1. Device is online (check /devices page)
2. Device has pending commands (check /devices page)
3. Wait 1 minute for next device ping
4. Check server console logs

**Solution:**
- Use "Push User" button on Devices page
- Manually push the specific user

### Device shows offline

**Check:**
1. Device push server settings
2. Network connectivity
3. Firewall allows port 8090

**Solution:**
- Verify device IP settings
- Restart device
- Check server is running

### User exists but no biometric

**This is normal!**
- The system only sends ID and name
- Biometric data is NEVER transmitted (security)
- You must register biometric on device

---

## 🔒 Security Notes

### What is Transmitted:
- ✅ User ID (4 digits)
- ✅ User Name
- ✅ Basic user settings

### What is NOT Transmitted:
- ❌ Biometric data (face/fingerprint)
- ❌ Personal information
- ❌ Attendance history

**Why?**
Biometric data is sensitive and should never leave the device. The system only sends the minimum data needed to create a user account. You must register biometrics locally on the device.

---

## 📊 Command Queue System

### How Commands are Queued:

1. **Student Added** → Command queued for all active devices
2. **Device Pings** → Server sends oldest command
3. **Command Sent** → Removed from queue
4. **Next Ping** → Next command sent (if any)

### Queue Management:

- Commands are sent one at a time
- Device pings every ~1 minute
- Multiple commands are sent sequentially
- Old commands (>24 hours) can be cleared manually

---

## 🎯 Best Practices

### For Daily Use:
1. ✅ Add students via web interface
2. ✅ Let system automatically push to devices
3. ✅ Register biometrics on device
4. ✅ Monitor device status on /devices page

### For Bulk Operations:
1. Add all students via web interface
2. Use "Push All" to sync entire database
3. Register biometrics for each user
4. Test with a few students first

### For Multiple Devices:
1. All devices receive user data automatically
2. Register biometrics on each device separately
3. Each device tracks attendance independently
4. All attendance records are centralized in database

---

## 📞 Support

### Common Issues:

**"Student not found in database"**
- Add student via web interface first
- Check student ID matches exactly

**"Device not receiving commands"**
- Check device is online
- Verify push server settings
- Check firewall/network

**"Biometric not working"**
- Ensure biometric is registered on device
- System only sends ID/name, not biometric data
- Register face/fingerprint locally

---

## 🚀 Quick Reference

### URLs:
- Dashboard: http://localhost:8090
- Add Student: http://localhost:8090/students/add
- Devices: http://localhost:8090/devices
- Attendance: http://localhost:8090/attendance

### Device Endpoints:
- Ping: GET http://YOUR_IP:8090/iclock/cdata?SN=xxx
- Push Data: POST http://YOUR_IP:8090/iclock/cdata

### Workflow:
1. Add Student → Auto-queued
2. Device Ping → Command sent
3. Register Biometric → Ready
4. Use Device → Attendance recorded

---

**That's it! The system handles everything automatically. You just add students and register biometrics.** 🎉

