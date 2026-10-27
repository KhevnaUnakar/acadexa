const express = require("express");
const Attendance = require("../models/attendance");
const createAcademicRecordRoutes = require("./academicRecordRoutes");
const { getCourseAttendance, markCourseAttendance } = require("../controllers/attendanceController");

const router = express.Router();

router.get("/course/:courseId", getCourseAttendance);
router.post("/course/:courseId/mark", markCourseAttendance);
router.use(
    createAcademicRecordRoutes(
        Attendance,
        ["student", "date", "status"],
        [{ path: "student", select: "studentId firstName lastName" }]
    )
);

module.exports = router;
