const mongoose = require("mongoose");

const examinationSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        totalMarks: {
            type: Number,
            required: true,
            min: 1
        },
        marksObtained: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator(value) {
                    const totalMarks = this.totalMarks ?? this.get("totalMarks");
                    return totalMarks === undefined || value <= totalMarks;
                },
                message: "Marks obtained cannot exceed total marks."
            }
        },
        result: {
            type: String,
            enum: ["Pass", "Fail", "Pending"],
            required: true,
            default: "Pending"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Examination", examinationSchema);
