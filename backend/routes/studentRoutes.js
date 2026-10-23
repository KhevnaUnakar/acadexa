const express = require("express");
const router = express.Router();

const { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent } = require("../controllers/studentController");

// GET /api/students - Get all students
router.get("/", getAllStudents);

// POST /api/students - Create a new student
router.post("/", createStudent);

// GET /api/students/:id - Get a student by ID
router.get("/:id", getStudentById);

// PUT /api/students/:id - Update a student by ID
router.put("/:id", updateStudent);

// DELETE /api/students/:id - Delete a student by ID
router.delete("/:id", deleteStudent);

module.exports = router;