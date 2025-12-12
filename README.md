# 📚 Attendance Management System with Face Recognition

A complete attendance management system that integrates with ZKTeco face recognition devices. Built with Node.js, Express, MongoDB, and EJS.

## ✨ Features

- **Student Management**: Add, view, and delete students with auto-generated 4-digit IDs
- **Automatic Attendance Recording**: Attendance is automatically recorded when students use the face recognition device
- **Beautiful Dashboard**: Modern, responsive UI with statistics and recent attendance
- **Search & Filter**: Search attendance records by student ID or date
- **Device Integration**: Full support for ZKTeco face recognition devices with push protocol

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- ZKTeco face recognition device (optional, for testing)

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Start MongoDB**
```bash
# On macOS with Homebrew
brew services start mongodb-community

# Or manually
mongod --dbpath /path/to/your/data/directory
```

3. **Start the Application**
```bash
node app.js
```

The application will run on `http://localhost:8090`

## 📖 How to Use

### 1. Add Students

1. Navigate to **Add Student** page
2. Fill in student details (name, email, phone, department)
3. Click **Add Student**
4. A unique **4-digit ID** will be generated automatically
5. **Important**: Write down this ID - you'll need it for the device!

### 2. Configure Face Recognition Device

1. Go to your ZKTeco device menu
2. Add a new user with the **4-digit ID** from step 1
3. Register the student's face on the device
4. Configure device settings:
   - **Menu → System → Device Type**: Change to "T&A PUSH" (NOT "A&C PUSH")
   - **Menu → Comm → Push Server**: 
     - IP Address: Your server IP (e.g., 192.168.1.100)
     - Port: 8090
     - Push Interval: 1 minute (recommended)

### 3. Automatic Attendance

Once configured, when a student uses the face recognition device:
- The device sends attendance data to the server
- The system finds the student by their ID
- Attendance is automatically recorded with:
  - Student name
  - Date and time
  - Verification method (Face Recognition)
  - Device serial number

### 4. View Attendance

- **Dashboard**: See today's attendance count and recent records
- **Attendance Page**: View all records with pagination
- **Search**: Filter by student ID or specific date

## 📁 Project Structure

```
Facerecgo/
├── app.js                 # Main application file
├── models/
│   ├── Student.js        # Student database model
│   └── Attendance.js     # Attendance database model
├── views/
│   ├── index.ejs         # Dashboard page
│   ├── students.ejs      # Students list page
│   ├── add-student.ejs   # Add student form
│   ├── student-success.ejs # Success page with ID
│   └── attendance.ejs    # Attendance records page
├── public/
│   └── css/
│       └── style.css     # Styling
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Web Routes

- `GET /` - Dashboard
- `GET /students` - View all students
- `GET /students/add` - Add student form
- `POST /students/add` - Create new student
- `DELETE /students/:id` - Delete student
- `GET /attendance` - View attendance records
- `GET /attendance/search` - Search attendance

### Device Integration Routes

- `GET /iclock/cdata` - Device ping/heartbeat
- `POST /iclock/cdata` - Receive attendance data from device
- `GET /iclock/registry` - Device registration
- `POST /iclock/registry` - Device registration (POST)

## 🗄️ Database Schema

### Student Model
```javascript
{
  studentId: String (4 digits, unique),
  name: String (required),
  email: String,
  phone: String,
  department: String,
  createdAt: Date
}
```

### Attendance Model
```javascript
{
  studentId: String (required),
  studentName: String (required),
  dateTime: Date (required),
  status: String (default: 'Present'),
  verifyMethod: String (default: 'N/A'),
  deviceSN: String (default: 'Unknown'),
  createdAt: Date
}
```

## 🛠️ Troubleshooting

### Device Not Sending Data

1. **Check Device Type**: Must be "T&A PUSH" not "A&C PUSH"
2. **Verify Network**: Device and server must be on same network
3. **Check Firewall**: Port 8090 must be open
4. **Test Connection**: Device should show "Connected" status

### MongoDB Connection Error

```bash
# Make sure MongoDB is running
brew services list | grep mongodb

# Or check manually
ps aux | grep mongod

# Start if not running
brew services start mongodb-community
```

### Port Already in Use

If port 8090 is already in use, change it in `app.js`:
```javascript
const PORT = 8090; // Change to another port like 3000
```

## 📊 Data Flow

```
Student Face Recognition
         ↓
ZKTeco Device (4-digit ID)
         ↓
Push to Server (POST /iclock/cdata)
         ↓
Find Student in Database
         ↓
Create Attendance Record
         ↓
Display in Web Interface
```

## 🎨 Features Highlight

- ✅ Auto-generated unique 4-digit student IDs
- ✅ Real-time attendance recording from device
- ✅ Beautiful, modern, responsive UI
- ✅ Search and filter capabilities
- ✅ Pagination for large datasets
- ✅ Student management (add/delete)
- ✅ Dashboard with statistics
- ✅ Full device integration support

## 📝 Notes

- The 4-digit ID is automatically generated and must be unique
- You need to manually add the ID to your face recognition device
- The system supports multiple devices (tracked by device serial number)
- Attendance records are permanent and linked to student profiles
- Deleting a student also deletes their attendance history

## 🔐 Security Considerations

For production use, consider adding:
- User authentication and authorization
- HTTPS/SSL encryption
- Input validation and sanitization
- Rate limiting
- Database backup strategy
- Environment variables for sensitive data

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify device configuration
3. Check console logs for error messages
4. Ensure MongoDB is running

## 📄 License

MIT License - Feel free to use and modify as needed.

---

**Built with ❤️ for easy attendance management**

