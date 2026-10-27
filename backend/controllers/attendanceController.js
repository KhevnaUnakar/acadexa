const mongoose = require("mongoose");
const Attendance = require("../models/attendance");
const Course = require("../models/course");
const Student = require("../models/student");

const parseDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
        ? null
        : date;
};

const getCourseAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const date = parseDate(req.query.date);

        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({ message: "Invalid course ID." });
        }
        if (!date) {
            return res.status(400).json({ message: "A valid attendance date is required." });
        }

        const course = await Course.findById(courseId).select("courseCode courseName");
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        const students = await Student.find({ course: courseId })
            .select("studentId firstName lastName email enrollmentStatus course")
            .sort({ firstName: 1, lastName: 1 });
        const studentIds = students.map((student) => student._id);
        const nextDay = new Date(date);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        const attendance = studentIds.length
            ? await Attendance.find({
                  student: { $in: studentIds },
                  date: { $gte: date, $lt: nextDay }
              }).select("student date status")
            : [];

        return res.status(200).json({ course, date, students, attendance });
    } catch (error) {
        console.error("Error fetching course attendance:", error);
        return res.status(500).json({ message: "Unable to load attendance for this course." });
    }
};

const markCourseAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const date = parseDate(req.body.date);
        const entries = req.body.entries;

        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({ message: "Invalid course ID." });
        }
        if (!date) {
            return res.status(400).json({ message: "A valid attendance date is required." });
        }
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ message: "Attendance entries are required." });
        }
        if (entries.some((entry) =>
            !entry ||
            !mongoose.isValidObjectId(entry.student) ||
            !["Present", "Absent"].includes(entry.status)
        )) {
            return res.status(400).json({ message: "Each attendance entry needs a valid student and Present or Absent status." });
        }

        const submittedStudentIds = entries.map((entry) => String(entry.student));
        if (new Set(submittedStudentIds).size !== submittedStudentIds.length) {
            return res.status(400).json({ message: "A student can only be included once per attendance submission." });
        }

        const course = await Course.findById(courseId).select("courseCode courseName");
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        const students = await Student.find({ course: courseId }).select("_id");
        const courseStudentIds = new Set(students.map((student) => String(student._id)));
        if (
            students.length !== entries.length ||
            submittedStudentIds.some((studentId) => !courseStudentIds.has(studentId))
        ) {
            return res.status(400).json({
                message: "Submit exactly one attendance status for every student currently assigned to this course."
            });
        }

        const operations = entries.map((entry) => ({
            updateOne: {
                filter: { student: entry.student, date },
                update: {
                    $set: { status: entry.status },
                    $setOnInsert: { student: entry.student, date }
                },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(operations, { ordered: true });

        const studentIds = students.map((student) => student._id);
        const attendance = await Attendance.find({
            student: { $in: studentIds },
            date: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
        }).select("student date status");

        return res.status(200).json({
            message: `Attendance saved for ${attendance.length} students.`,
            attendance
        });
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ message: error.message });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: "Attendance for one or more students was updated at the same time. Reload the course roster and try again." });
        }
        console.error("Error marking course attendance:", error);
        return res.status(500).json({
            message: "Unable to complete attendance saving. Some entries may already have been saved; reload the roster before retrying."
        });
    }
};

module.exports = { getCourseAttendance, markCourseAttendance };
