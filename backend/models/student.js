
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        firstName: {
            type: String,
            required: true,
            trim: true
        },

        lastName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department"
        },

        semester: {
            type: Number,
            min: 1,
            max: 8
        },

        enrollmentStatus: {
            type: String,
            enum: ["Active", "Graduated", "Discontinued"],
            default: "Active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Student", studentSchema);
