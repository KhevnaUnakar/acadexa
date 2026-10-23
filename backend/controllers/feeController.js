const Fee = require("../models/fee");
const Student = require("../models/student");
const Course = require("../models/course");


const createFee = async (req, res) => {
    try {
        const { student, course, totalFee } = req.body;

        if (!student || !course) {
            return res.status(400).json({
                message: "Student and course are required."
            });
        }

        const studentExists = await Student.findById(student);
        const courseExists = await Course.findById(course);

        if (!studentExists) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        if (!courseExists) {
            return res.status(404).json({
                message: "Course not found."
            });
        }

        // Use the course fee as the standard fee.
        // Update "fee" below if your Course schema uses another field name.
        const standardFee = courseExists.fee;

        if (
            typeof standardFee !== "number" ||
            !Number.isFinite(standardFee) ||
            standardFee < 0
        ) {
            return res.status(400).json({
                message: "The course must have a valid standard fee."
            });
        }

        const finalFee =
            totalFee === undefined ? standardFee : totalFee;

        if (
            typeof finalFee !== "number" ||
            !Number.isFinite(finalFee) ||
            finalFee < 0
        ) {
            return res.status(400).json({
                message: "The student fee must be a valid non-negative number."
            });
        }

        const existingFee = await Fee.findOne({
            student,
            course
        });

        if (existingFee) {
            return res.status(409).json({
                message: "A fee record already exists for this student and course."
            });
        }

        const fee = await Fee.create({
            student,
            course,
            standardFee,
            totalFee: finalFee,
            payments: [],
            paidAmount: 0,
            balance: finalFee,
            paymentStatus: "Pending"
        });

        return res.status(201).json({
            message: "Fee record created successfully.",
            fee
        });
    } catch (error) {
        console.error("Error creating fee:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid student or course ID."
            });
        }

        return res.status(500).json({
            message: "Unable to create fee record."
        });
    }
};


const getAllFees = async (req, res) => {
    try {
        const fees = await Fee.find()
            .populate("student", "studentId firstName lastName email")
            .populate("course", "courseCode courseName fee")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: fees.length,
            fees
        });
    } catch (error) {
        console.error("Error fetching fees:", error);

        return res.status(500).json({
            message: "Unable to fetch fee records."
        });
    }
};


const addPayment = async (req, res) => {
    try {
        const { amount, paymentMethod, referenceNumber, remarks } = req.body;
        const { id } = req.params;

        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                message: "Payment amount must be a positive number."
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                message: "Payment method is required."
            });
        }

        const fee = await Fee.findById(id);

        if (!fee) {
            return res.status(404).json({
                message: "Fee record not found."
            });
        }

        if (amount > fee.balance) {
            return res.status(400).json({
                message: "Payment cannot exceed the remaining balance."
            });
        }

        fee.payments.push({
            amount,
            paymentMethod,
            referenceNumber,
            remarks
        });

        fee.paidAmount = fee.payments.reduce(
            (total, payment) => total + payment.amount,
            0
        );

        fee.balance = Math.max(0, fee.totalFee - fee.paidAmount);

        if (fee.balance === 0) {
            fee.paymentStatus = "Paid";
        } else if (fee.paidAmount > 0) {
            fee.paymentStatus = "Partial";
        } else {
            fee.paymentStatus = "Pending";
        }

        await fee.save();

        return res.status(200).json({
            message: "Payment recorded successfully.",
            fee
        });
    } catch (error) {
        console.error("Error recording payment:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid fee record ID."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Unable to record payment."
        });
    }
};


module.exports = {
    createFee,
    getAllFees,
    addPayment
};