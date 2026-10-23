const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        paymentDate: {
            type: Date,
            default: Date.now
        },
        paymentMethod: {
            type: String,
            enum: [
                "Cash",
                "UPI",
                "Card",
                "Bank Transfer",
                "Other"
            ],
            required: true
        },
        referenceNumber: {
            type: String,
            trim: true,
            default: ""
        },
        remarks: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { timestamps: true }
);

const feeSchema = new mongoose.Schema(
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
        standardFee: {
            type: Number,
            required: true,
            min: 0
        },
        totalFee: {
            type: Number,
            required: true,
            min: 0
        },
        payments: {
            type: [paymentSchema],
            default: []
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        balance: {
            type: Number,
            required: true,
            min: 0
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Partial", "Paid"],
            default: "Pending"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);
