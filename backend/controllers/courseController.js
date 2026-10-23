const Course = require("../models/course");
const mongoose = require("mongoose");

const createCourse = async (req, res) => {
    try {
        const course = await Course.create(req.body);

        res.status(201).json({
            message: "Course created successfully",
            course
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Course code already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to create course"
        });
    }
};

const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });

        res.status(200).json({
            count: courses.length,
            courses
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch courses"
        });
    }
};


const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid course ID"
            });
        }

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.status(200).json({ course });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch course"
        });
    }
};

const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid course ID"
            });
        }

        const allowedFields = [
            "courseCode",
            "courseName",
            "duration",
            "description",
            "status"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid fields provided"
            });
        }

        const course = await Course.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.status(200).json({
            message: "Course updated successfully",
            course
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Course code already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to update course"
        });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid course ID"
            });
        }

        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.status(200).json({
            message: "Course deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete course"
        });
    }
};

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};
