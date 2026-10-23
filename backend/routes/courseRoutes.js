const express = require("express");
const router = express.Router();

const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
} = require("../controllers/courseController");

// Get all courses
router.get("/", getAllCourses);

// Create a course
router.post("/", createCourse);

// Get one course
router.get("/:id", getCourseById);

// Update a course
router.put("/:id", updateCourse);

// Delete a course
router.delete("/:id", deleteCourse);

module.exports = router;