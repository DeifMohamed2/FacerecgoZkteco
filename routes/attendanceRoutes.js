const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// Get all attendance records
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, studentId, startDate, endDate } = req.query;
        
        const query = {};
        if (studentId) query.studentId = studentId;
        if (startDate || endDate) {
            query.dateTime = {};
            if (startDate) query.dateTime.$gte = new Date(startDate);
            if (endDate) query.dateTime.$lte = new Date(endDate);
        }

        const attendances = await Attendance.find(query)
            .sort({ dateTime: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await Attendance.countDocuments(query);

        res.json({
            attendances,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get attendance statistics
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = await Attendance.countDocuments({
            dateTime: { $gte: today }
        });

        const totalCount = await Attendance.countDocuments();
        
        const uniqueStudents = await Attendance.distinct('studentId');
        
        res.json({
            todayCount,
            totalCount,
            uniqueStudents: uniqueStudents.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

