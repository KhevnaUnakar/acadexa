const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const feeRoutes = require("./routes/feeRoutes");
const Department = require("./models/department");
const Admission = require("./models/admission");
const Attendance = require("./models/attendance");
const Examination = require("./models/examination");
const createAcademicRecordRoutes = require("./routes/academicRecordRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Student API routes
app.use("/api/students", studentRoutes);

// Course API routes
app.use("/api/courses", courseRoutes);

// Fee API routes
app.use("/api/fees", feeRoutes);
app.use(
    "/api/departments",
    createAcademicRecordRoutes(Department, ["departmentName", "departmentCode", "description"])
);
app.use(
    "/api/admissions",
    createAcademicRecordRoutes(
        Admission,
        ["student", "course", "admissionDate", "admissionStatus"],
        [
            { path: "student", select: "studentId firstName lastName" },
            { path: "course", select: "courseCode courseName" }
        ]
    )
);
app.use(
    "/api/attendance",
    createAcademicRecordRoutes(Attendance, ["student", "date", "status"], [
        { path: "student", select: "studentId firstName lastName" }
    ])
);
app.use(
    "/api/examinations",
    createAcademicRecordRoutes(
        Examination,
        ["student", "subject", "totalMarks", "marksObtained", "result"],
        [{ path: "student", select: "studentId firstName lastName" }]
    )
);


// Test route
app.get("/", (req, res) => {
    res.send("Student Management System API is running!");
});

// Start server after connecting to MongoDB
const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();