const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },
        admissionDate: {
            type: Date,
            required: true
        },
        admissionStatus: {
            type: String,
            enum: ["Applied", "Approved", "Rejected"],
            default: "Applied"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Admission", admissionSchema);
