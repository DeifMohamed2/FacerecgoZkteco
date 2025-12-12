# SensFace Device Setup & User Management

## Important Information About Adding Students to Devices

### ⚠️ How ZKTeco/SensFace Devices Work

**SensFace 2A devices use the ZKTeco PUSH Protocol**, which has specific limitations:

1. **User Data Can Be Pushed** ✅
   - User ID (PIN)
   - Name
   - Privilege level
   - Group

2. **Biometric Data CANNOT Be Pushed** ❌
   - Fingerprint templates
   - Face templates
   - These MUST be enrolled directly on the device

### The Complete Process

#### Step 1: Add Student in Web Application
1. Go to "Add Student" page
2. Fill in student information
3. Click "Add Student"
4. System will:
   - Generate unique 4-digit ID
   - Save to MongoDB
   - Push user data to all connected devices

#### Step 2: Enroll Biometrics on Device (REQUIRED!)
**This MUST be done manually on the device:**

1. On the device screen, go to: **Menu > User Management > User > Enroll**
2. Enter the student ID (the 4-digit number shown in web app)
3. The device will show the student's name (confirming the user was pushed successfully)
4. Follow device prompts to:
   - Scan fingerprint (3-4 times)
   - OR capture face photo
5. Save and exit

#### Step 3: Attendance Will Work
- Once biometric is enrolled, student can check in/out
- Attendance records will automatically appear in the web application

---

## Device Configuration

### 1. Set Device IP Address

**On Device:**
1. Menu > System > Communication > Network
2. Set IP Address: `192.168.1.8` (or your preferred IP)
3. Set Subnet Mask: `255.255.255.0`
4. Set Gateway: `192.168.1.1` (your router IP)
5. Save

**In Application:**
Edit `config/devices.js`:
```javascript
{
    name: 'Device 1',
    ip: '192.168.1.8',  // Match device IP
    port: 80,
    username: 'admin',
    password: 'admin',
    sn: ''  // Will auto-populate when device connects
}
```

### 2. Set Device to T&A PUSH Mode

**On Device:**
1. Menu > System > Device Type Setting
2. Change from "A&C PUSH" to **"T&A PUSH"**
3. Restart device

### 3. Configure Push Server

**On Device:**
1. Menu > System > Communication > Push Server
2. Set **Push Server IP**: Your server's IP (e.g., `192.168.1.100`)
3. Set **Push Server Port**: `8090`
4. Set **Push Interval**: `60` seconds
5. Save and restart device

---

## Troubleshooting

### Issue: Device shows "Connected" but student not added

**Cause:** User data was pushed, but biometric enrollment is required.

**Solution:**
1. Check device logs to confirm user was received
2. Go to device: Menu > User Management > User
3. Find the student ID in the list
4. If student is there, enroll fingerprint/face
5. If student is NOT there, check:
   - Device SN matches in `config/devices.js`
   - Device is actually connected (check last seen time)
   - Check server logs for errors

### Issue: Device status keeps changing between Connected/Disconnected

**Cause:** Device ping interval is inconsistent or network issues.

**Solution:**
1. Check device push interval setting (should be 60 seconds or less)
2. Check network stability
3. The app now marks device as disconnected only if no ping for 60 seconds
4. Device will auto-reconnect when it pings again

### Issue: Attendance not appearing in web app

**Possible causes:**
1. **Device not in T&A PUSH mode** - Change to T&A PUSH
2. **Push server not configured** - Set server IP and port
3. **Student not enrolled** - Enroll fingerprint/face on device
4. **Student ID mismatch** - Verify student ID matches

**Check:**
1. Look at server terminal logs - you should see:
   ```
   ✓ Device ping from NYU7242801574
   📥 Attendance saved: John Doe (1234) at 2025-12-13 12:30:00 - Check In
   ```
2. If you see "Unknown Student", the student ID on device doesn't match database

---

## ZKTeco PUSH Protocol Details

### User Data Format
```
DATA USER PIN=1234\tName=John Doe\tPri=0\tPasswd=\tCard=\tGrp=1
```

**Fields:**
- `PIN`: Student ID (4 digits)
- `Name`: Student name
- `Pri`: Privilege (0=normal user, 14=admin)
- `Passwd`: Password (usually empty)
- `Card`: Card number (usually empty)
- `Grp`: Group number (default=1)

### Attendance Data Format (Received from Device)
```
1234,2025-12-13 12:30:00,0,1
```

**Fields:**
- Field 1: Student ID
- Field 2: Date & Time
- Field 3: Status (0=Check In, 1=Check Out)
- Field 4: Verify Mode (1=Fingerprint, 15=Face, etc.)

---

## Best Practices

1. **Always enroll biometrics on device after adding student in web app**
2. **Keep device firmware updated** for best compatibility
3. **Use static IP for devices** to avoid connection issues
4. **Set device push interval to 60 seconds** for timely updates
5. **Monitor device status on dashboard** to ensure connectivity
6. **Check server logs** if attendance not appearing

---

## Device Commands Reference

### Useful Device Menu Paths

- **User Management**: Menu > User Management > User
- **Device Type**: Menu > System > Device Type Setting
- **Network Settings**: Menu > System > Communication > Network
- **Push Server**: Menu > System > Communication > Push Server
- **Device Info**: Menu > System > Device Info
- **Restart Device**: Menu > System > Restart

---

## Support

If you continue to have issues:

1. Check server terminal logs for errors
2. Check device system logs (Menu > System > Log)
3. Verify network connectivity between server and device
4. Ensure MongoDB is running and connected
5. Test device ping: `http://DEVICE_IP/iclock/cdata?SN=test`

