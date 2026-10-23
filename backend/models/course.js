
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
    {
        courseCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        courseName: {
            type: String,
            required: true,
            trim: true
        },

        fee: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        duration: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Course", courseSchema);
