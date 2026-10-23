const Student = require("../models/student");
const mongoose = require("mongoose");

// Create a new student
const createStudent = async (req, res) => {
    try {
        const { 
            studentId, 
            firstName, 
            lastName, 
            email, 
            phone, 
            course, 
            department, 
            semester, 
            enrollmentStatus 
        } = req.body;

        // Check required fields
        if (!studentId || !firstName || !lastName || !email) {
            return res.status(400).json({
                message: "Student ID, first name, last name, and email are required."
            });
        }

        const student = await Student.create({
            studentId,
            firstName,
            lastName,
            email,
            phone,
            course,
            department,
            semester,
            enrollmentStatus
        });

        res.status(201).json({
            message: "Student created successfully",
            student
        });
    }
    catch(error) {
        // Handle duplicate student ID or email
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];

            return res.status(409).json({
                message: `${field || "Student ID or email"} already exists.`
            });
        }

        // Handle MongoDB validation errors
        if (error.name === "ValidationError"
            || error.name === "CastError") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error("Error creating student:", error);
        
        res.status(500).json({
            message: "Server error while creating student"
        });
    }
}

const getAllStudents = async (req,res) => {
    try{
        const students = await Student.find().sort({ createdAt: -1 });

        return res.status(200).json({
            count: students.length,
            students
        });
    }
    catch(error){
        console.error("Get students error:", error);

        return res.status(500).json({
            message: "Server error while fetching students."
        });
    }
}

const getStudentById = async (req,res) => {
    try{
        const { id } = req.params;

        if(!mongoose.isValidObjectId(id)){
            return res.status(400).json({
                message: "Invalid student ID."
            });
        }

        const student = await Student.findById(id);

        if(!student){
            return res.status(404).json({
                message: "Student not found."
            });
        }

        return res.status(200).json({ student });
    }
    catch(error){
        console.error("Get student by Id error:", error);

        return res.status(500).json({
            message: "Server error while fetching student."
        });
    }
}

const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid student ID format."
            });
        }

        const allowedFields = [
            "studentId",
            "firstName",
            "lastName",
            "email",
            "phone",
            "course",
            "department",
            "semester",
            "enrollmentStatus"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "Provide at least one field to update."
            });
        }

        const student = await Student.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        return res.status(200).json({
            message: "Student updated successfully!",
            student
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Student ID or email already exists."
            });
        }

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error("Update student error:", error);

        return res.status(500).json({
            message: "Server error while updating student."
        });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid student ID format."
            });
        }

        const student = await Student.findByIdAndDelete(id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        return res.status(200).json({
            message: "Student deleted successfully!",
            student
        });

    } catch (error) {
        console.error("Delete student error:", error);

        return res.status(500).json({
            message: "Server error while deleting student."
        });
    }
};

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent };