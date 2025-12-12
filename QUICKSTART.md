# 🚀 Quick Start Guide

## Step-by-Step Setup (5 minutes)

### 1️⃣ Start MongoDB

```bash
# Option A: Using Homebrew (recommended)
brew services start mongodb-community

# Option B: Manual start
mongod --dbpath ~/data/db
```

### 2️⃣ Start the Application

```bash
# Using the startup script
./start.sh

# OR manually
node app.js
```

### 3️⃣ Open Your Browser

Navigate to: **http://localhost:8090**

You should see the dashboard!

---

## 📝 Adding Your First Student

1. Click **"Add Student"** in the navigation menu
2. Fill in the form:
   - **Name**: John Doe (required)
   - **Email**: john@example.com (optional)
   - **Phone**: +1234567890 (optional)
   - **Department**: Computer Science (optional)
3. Click **"Add Student"**
4. **IMPORTANT**: You'll see a 4-digit ID (e.g., **1234**)
5. **Write this down!** You need it for the device

---

## 🔌 Configure Your Face Recognition Device

### Device Settings:

1. **Add User to Device**:
   - Go to device menu → User Management
   - Add new user with the **4-digit ID** from above
   - Register the student's face

2. **Configure Device Type**:
   - Menu → System → Device Type Setting
   - Change to: **"T&A PUSH"** (NOT "A&C PUSH")
   - Save and restart device

3. **Configure Push Server**:
   - Menu → Comm → Push Server
   - **IP Address**: Your computer's IP (e.g., 192.168.1.100)
   - **Port**: 8090
   - **Push Interval**: 1 minute
   - Save settings

### Find Your Computer's IP:

```bash
# On macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig
```

---

## ✅ Test the System

1. **Add a student** via the web interface
2. **Note the 4-digit ID** (e.g., 5678)
3. **Add this ID to your device** with the student's face
4. **Have the student use the device** (face recognition)
5. **Check the dashboard** - attendance should appear automatically!

---

## 🎯 What Happens When a Student Checks In?

```
Student uses device → Device recognizes face → 
Device sends data to server → Server finds student by ID → 
Attendance recorded in database → Shows up in web interface
```

---

## 📱 Web Interface Pages

- **Dashboard** (`/`) - Overview with statistics
- **Students** (`/students`) - List all students
- **Add Student** (`/students/add`) - Add new student
- **Attendance** (`/attendance`) - View all attendance records

---

## 🔍 Search Attendance

On the Attendance page, you can:
- Search by **Student ID** (e.g., 1234)
- Filter by **Date** (e.g., 2025-12-13)
- View all records with pagination

---

## ⚠️ Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start it if not running
brew services start mongodb-community
```

### "Device not sending data"
- ✅ Check device type is "T&A PUSH"
- ✅ Verify IP address and port are correct
- ✅ Ensure device and computer are on same network
- ✅ Check firewall allows port 8090

### "Student not found in database"
- ✅ Make sure the ID on device matches the ID in system
- ✅ Check the Students page to verify the student exists

---

## 🎉 You're All Set!

Your attendance system is now running and ready to use. Students can check in using the face recognition device, and attendance will be automatically recorded!

### Need Help?

Check the full README.md for detailed documentation.

