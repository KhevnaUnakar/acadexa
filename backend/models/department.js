const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
    {
        departmentName: {
            type: String,
            required: true,
            trim: true
        },
        departmentCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
