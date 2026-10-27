const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        },
        applicantFirstName: {
            type: String,
            trim: true
        },
        applicantLastName: {
            type: String,
            trim: true
        },
        applicantEmail: {
            type: String,
            lowercase: true,
            trim: true
        },
        applicantPhone: {
            type: String,
            trim: true
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

admissionSchema.index({ applicantEmail: 1, course: 1 });

module.exports = mongoose.model("Admission", admissionSchema);
