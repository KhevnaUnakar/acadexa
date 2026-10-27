const crypto = require("crypto");
const mongoose = require("mongoose");
const Admission = require("../models/admission");
const Student = require("../models/student");
const Course = require("../models/course");

const admissionFields = [
    "student",
    "applicantFirstName",
    "applicantLastName",
    "applicantEmail",
    "applicantPhone",
    "course",
    "admissionDate",
    "admissionStatus"
];

const populateAdmission = (query) =>
    query
        .populate("student", "studentId firstName lastName email phone course enrollmentStatus")
        .populate("course", "courseCode courseName fee");

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const applicantDetails = (body, student) => ({
    applicantFirstName: student?.firstName || String(body.applicantFirstName || "").trim(),
    applicantLastName: student?.lastName || String(body.applicantLastName || "").trim(),
    applicantEmail: normalizeEmail(student?.email || body.applicantEmail),
    applicantPhone: student?.phone || String(body.applicantPhone || "").trim()
});

const getAll = async (req, res) => {
    try {
        const records = await populateAdmission(Admission.find()).sort({ createdAt: -1 });
        return res.status(200).json({ count: records.length, records });
    } catch (error) {
        console.error("Error fetching admissions:", error);
        return res.status(500).json({ message: "Unable to fetch admission records." });
    }
};

const create = async (req, res) => {
    try {
        const { student: studentId, course, admissionDate } = req.body;

        if (!course || !admissionDate) {
            return res.status(400).json({ message: "Course and application date are required." });
        }
        if (req.body.admissionStatus && req.body.admissionStatus !== "Applied") {
            return res.status(400).json({
                message: "New admissions must start as Applied. Use the admission actions to approve or reject."
            });
        }

        const courseExists = await Course.findById(course);
        if (!courseExists) {
            return res.status(404).json({ message: "Course not found." });
        }

        let existingStudent = null;
        if (studentId) {
            if (!mongoose.isValidObjectId(studentId)) {
                return res.status(400).json({ message: "Invalid student ID." });
            }
            existingStudent = await Student.findById(studentId);
            if (!existingStudent) {
                return res.status(404).json({ message: "Student not found." });
            }
        }

        const details = applicantDetails(req.body, existingStudent);
        if (!course || !admissionDate || !details.applicantFirstName || !details.applicantLastName || !details.applicantEmail) {
            return res.status(400).json({
                message: "Applicant first name, last name, email, course, and application date are required."
            });
        }

        const matchingStudent = existingStudent || await Student.findOne({ email: details.applicantEmail });
        const duplicate = await Admission.findOne({
            course,
            admissionStatus: { $ne: "Rejected" },
            $or: [
                { applicantEmail: details.applicantEmail },
                ...(matchingStudent ? [{ student: matchingStudent._id }] : [])
            ]
        });

        if (duplicate) {
            return res.status(409).json({
                message: "An active admission already exists for this applicant and course."
            });
        }

        const record = await Admission.create({
            ...details,
            student: existingStudent?._id,
            course,
            admissionDate,
            admissionStatus: "Applied"
        });

        return res.status(201).json({
            message: "Admission application created successfully.",
            record
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An admission already exists for this applicant and course." });
        }
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error creating admission:", error);
        return res.status(500).json({ message: "Unable to create admission application." });
    }
};

const update = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid admission ID." });
        }

        const admission = await Admission.findById(req.params.id);
        if (!admission) {
            return res.status(404).json({ message: "Admission not found." });
        }
        if (admission.admissionStatus === "Approved") {
            return res.status(409).json({ message: "Approved admissions cannot be edited." });
        }
        if (req.body.admissionStatus === "Approved") {
            return res.status(400).json({ message: "Use the approve action to enroll this applicant." });
        }

        const updates = Object.fromEntries(
            admissionFields
                .filter((field) => req.body[field] !== undefined)
                .map((field) => [field, req.body[field]])
        );
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid admission fields provided." });
        }

        if (updates.student && !mongoose.isValidObjectId(updates.student)) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        const linkedStudent = updates.student === ""
            ? null
            : updates.student
            ? await Student.findById(updates.student)
            : admission.student
                ? await Student.findById(admission.student)
                : null;
        const details = applicantDetails({ ...admission.toObject(), ...updates }, linkedStudent);
        const course = updates.course || admission.course;
        const admissionDate = updates.admissionDate || admission.admissionDate;

        if (!details.applicantFirstName || !details.applicantLastName || !details.applicantEmail || !course || !admissionDate) {
            return res.status(400).json({
                message: "Applicant first name, last name, email, course, and application date are required."
            });
        }
        if (updates.course && !(await Course.exists({ _id: updates.course }))) {
            return res.status(404).json({ message: "Course not found." });
        }

        let student = linkedStudent;
        if (updates.student) {
            if (!mongoose.isValidObjectId(updates.student)) {
                return res.status(400).json({ message: "Invalid student ID." });
            }
            student = student || await Student.findById(updates.student);
            if (!student) {
                return res.status(404).json({ message: "Student not found." });
            }
        }

        const matchingStudent = student || await Student.findOne({ email: details.applicantEmail });
        const linkedStudentId = student?._id || matchingStudent?._id || (updates.student === "" ? null : admission.student);
        const duplicate = await Admission.findOne({
            _id: { $ne: admission._id },
            course,
            admissionStatus: { $ne: "Rejected" },
            $or: [
                { applicantEmail: details.applicantEmail },
                ...(linkedStudentId ? [{ student: linkedStudentId }] : [])
            ]
        });
        if (duplicate) {
            return res.status(409).json({
                message: "An active admission already exists for this applicant and course."
            });
        }

        Object.assign(admission, updates, details, { course, admissionDate });
        if (updates.student) {
            admission.student = student._id;
        } else if (updates.student === "") {
            admission.student = undefined;
        }
        await admission.save();

        return res.status(200).json({
            message: "Admission updated successfully.",
            record: admission
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An admission already exists for this applicant and course." });
        }
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error updating admission:", error);
        return res.status(500).json({ message: "Unable to update admission." });
    }
};

const approve = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid admission ID." });
        }

        const admission = await Admission.findById(req.params.id);
        if (!admission) {
            return res.status(404).json({ message: "Admission not found." });
        }
        if (admission.admissionStatus === "Rejected") {
            return res.status(409).json({ message: "Rejected admissions cannot be approved. Create a new application instead." });
        }

        const course = await Course.findById(admission.course);
        if (!course) {
            return res.status(404).json({ message: "The course for this admission no longer exists." });
        }

        let student = admission.student
            ? await Student.findById(admission.student)
            : null;
        const email = normalizeEmail(admission.applicantEmail || student?.email);

        if (!email) {
            return res.status(400).json({ message: "Applicant email is required before approval." });
        }

        if (!student) {
            student = await Student.findOne({ email });
        }

        if (student) {
            student.course = course._id;
            student.enrollmentStatus = "Active";
            await student.save();
        } else {
            const firstName = String(admission.applicantFirstName || "").trim();
            const lastName = String(admission.applicantLastName || "").trim();
            if (!firstName || !lastName) {
                return res.status(400).json({ message: "Applicant first and last name are required before approval." });
            }

            try {
                student = await Student.create({
                    studentId: `STU-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
                    firstName,
                    lastName,
                    email,
                    phone: admission.applicantPhone,
                    course: course._id,
                    enrollmentStatus: "Active"
                });
            } catch (error) {
                if (error.code !== 11000) {
                    throw error;
                }
                student = await Student.findOne({ email });
                if (!student) {
                    return res.status(409).json({ message: "A student ID or email conflict prevented enrollment. Please retry or review student records." });
                }
                student.course = course._id;
                student.enrollmentStatus = "Active";
                await student.save();
            }
        }

        admission.student = student._id;
        admission.applicantFirstName = student.firstName;
        admission.applicantLastName = student.lastName;
        admission.applicantEmail = email;
        admission.applicantPhone = student.phone || admission.applicantPhone;
        admission.admissionStatus = "Approved";
        await admission.save();

        const record = await populateAdmission(Admission.findById(admission._id));
        return res.status(200).json({
            message: "Admission approved and student enrollment completed.",
            record,
            student
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "A student with this email or student ID already exists." });
        }
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error approving admission:", error);
        return res.status(500).json({
            message: "Unable to complete admission approval. The admission remains unapproved; retry after verifying student records."
        });
    }
};

const remove = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid admission ID." });
        }
        const record = await Admission.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({ message: "Admission not found." });
        }
        return res.status(200).json({ message: "Admission deleted successfully." });
    } catch (error) {
        console.error("Error deleting admission:", error);
        return res.status(500).json({ message: "Unable to delete admission." });
    }
};

module.exports = { getAll, create, update, approve, remove };
