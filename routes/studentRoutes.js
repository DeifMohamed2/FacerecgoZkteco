const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { deviceStatus } = require('../config/devices');
const axios = require('axios');

// Generate random 4-digit ID
function generateStudentId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Check if student ID exists
async function isStudentIdExists(id) {
    const student = await Student.findOne({ studentId: id });
    return !!student;
}

// Generate unique student ID
async function generateUniqueStudentId() {
    let id = generateStudentId();
    while (await isStudentIdExists(id)) {
        id = generateStudentId();
    }
    return id;
}

// Add student to a specific device
async function addStudentToDevice(student, device) {
    try {
        const url = `http://${device.ip}:${device.port}/api/user/add`;
        
        const studentData = {
            user_id: student.studentId,
            name: student.name,
            privilege: 0, // Normal user
            password: '',
            card_no: '',
            group: 1
        };

        const response = await axios.post(url, studentData, {
            auth: {
                username: device.username,
                password: device.password
            },
            timeout: 5000
        });

        return {
            success: true,
            device: device.name,
            message: 'Student added successfully'
        };
    } catch (error) {
        return {
            success: false,
            device: device.name,
            message: error.response?.data?.message || error.message || 'Failed to add student'
        };
    }
}

// Get all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new student
router.post('/add', async (req, res) => {
    try {
        const { name, email, phone, department } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Generate unique student ID
        const studentId = await generateUniqueStudentId();

        // Create student
        const student = new Student({
            studentId,
            name,
            email: email || '',
            phone: phone || '',
            department: department || ''
        });

        await student.save();

        // Add student to all connected devices
        const deviceResults = [];
        const connectedDevices = Array.from(deviceStatus.values()).filter(d => d.connected);

        if (connectedDevices.length > 0) {
            const addPromises = connectedDevices.map(device => 
                addStudentToDevice(student, device)
            );
            const results = await Promise.allSettled(addPromises);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    deviceResults.push(result.value);
                } else {
                    deviceResults.push({
                        success: false,
                        device: connectedDevices[index].name,
                        message: result.reason.message || 'Unknown error'
                    });
                }
            });
        }

        res.json({
            success: true,
            student,
            deviceResults
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

