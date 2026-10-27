const { beforeEach, describe, it } = require("node:test");
const assert = require("node:assert/strict");

const admissions = [];
const students = [];
const courses = [];

const toId = (value) => String(value?._id || value || "");

class MockQuery {
    constructor(value) {
        this.value = value;
    }

    populate() {
        return this;
    }

    sort() {
        return this;
    }

    then(resolve, reject) {
        return Promise.resolve(this.value).then(resolve, reject);
    }
}

const isMatch = (record, filter) => {
    if (filter._id?.$ne && toId(record._id) === toId(filter._id.$ne)) return false;
    if (filter.course && toId(record.course) !== toId(filter.course)) return false;
    if (filter.admissionStatus?.$ne && record.admissionStatus === filter.admissionStatus.$ne) return false;
    if (filter.$or && !filter.$or.some((condition) => {
        const [field, value] = Object.entries(condition)[0];
        return toId(record[field]) === toId(value);
    })) return false;
    return true;
};

const Admission = {
    findById(id) {
        return new MockQuery(admissions.find((record) => toId(record._id) === toId(id)) || null);
    },
    findOne(filter) {
        return Promise.resolve(admissions.find((record) => isMatch(record, filter)) || null);
    },
    create(data) {
        const record = {
            ...data,
            _id: String(admissions.length + 1).padStart(24, "0"),
            async save() {
                return this;
            },
            toObject() {
                return { ...this };
            }
        };
        admissions.push(record);
        return Promise.resolve(record);
    },
    async findByIdAndDelete(id) {
        const index = admissions.findIndex((record) => toId(record._id) === toId(id));
        if (index < 0) return null;
        return admissions.splice(index, 1)[0];
    }
};

const Student = {
    findById(id) {
        return Promise.resolve(students.find((student) => toId(student._id) === toId(id)) || null);
    },
    findOne(filter) {
        return Promise.resolve(students.find((student) => student.email === filter.email) || null);
    },
    async create(data) {
        if (students.some((student) => student.email === data.email)) {
            const error = new Error("Duplicate email");
            error.code = 11000;
            throw error;
        }
        const student = {
            ...data,
            _id: String(students.length + 1).padStart(24, "0"),
            async save() {
                return this;
            }
        };
        students.push(student);
        return student;
    }
};

const Course = {
    findById(id) {
        return Promise.resolve(courses.find((course) => toId(course._id) === toId(id)) || null);
    },
    exists({ _id }) {
        return Promise.resolve(courses.some((course) => toId(course._id) === toId(_id)));
    }
};

require.cache[require.resolve("../models/admission")] = { exports: Admission };
require.cache[require.resolve("../models/student")] = { exports: Student };
require.cache[require.resolve("../models/course")] = { exports: Course };

const controller = require("../controllers/admissionController");
const courseId = "cccccccccccccccccccccccc";
const studentId = "dddddddddddddddddddddddd";

const response = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

const applicantRequest = (overrides = {}) => ({
    body: {
        applicantFirstName: "Ada",
        applicantLastName: "Lovelace",
        applicantEmail: "ada@example.edu",
        applicantPhone: "555-0100",
        course: courseId,
        admissionDate: "2026-10-27",
        ...overrides
    }
});

describe("admission workflow", () => {
    beforeEach(() => {
        admissions.length = 0;
        students.length = 0;
        courses.length = 0;
        courses.push({ _id: courseId, courseCode: "CS", courseName: "Computer Science" });
    });

    it("creates an applicant without creating a student, then enrolls them on approval", async () => {
        const createResponse = response();
        await controller.create(applicantRequest(), createResponse);

        assert.equal(createResponse.statusCode, 201);
        assert.equal(admissions.length, 1);
        assert.equal(admissions[0].admissionStatus, "Applied");
        assert.equal(admissions[0].student, undefined);
        assert.equal(students.length, 0);

        const approveResponse = response();
        await controller.approve({ params: { id: admissions[0]._id } }, approveResponse);

        assert.equal(approveResponse.statusCode, 200);
        assert.equal(admissions[0].admissionStatus, "Approved");
        assert.equal(admissions[0].student, students[0]._id);
        assert.equal(students.length, 1);
        assert.equal(students[0].email, "ada@example.edu");
        assert.equal(students[0].course, courseId);
        assert.equal(students[0].enrollmentStatus, "Active");
    });

    it("does not create another student when approval is repeated", async () => {
        const createResponse = response();
        await controller.create(applicantRequest(), createResponse);
        const id = admissions[0]._id;

        await controller.approve({ params: { id } }, response());
        const repeatedResponse = response();
        await controller.approve({ params: { id } }, repeatedResponse);

        assert.equal(repeatedResponse.statusCode, 200);
        assert.equal(students.length, 1);
        assert.equal(admissions[0].student, students[0]._id);
    });

    it("rejects duplicate active applicant/course applications", async () => {
        await controller.create(applicantRequest(), response());
        const duplicateResponse = response();
        await controller.create(applicantRequest(), duplicateResponse);

        assert.equal(duplicateResponse.statusCode, 409);
        assert.equal(admissions.length, 1);
        assert.equal(students.length, 0);
    });

    it("does not enroll an applicant when their application is rejected", async () => {
        await controller.create(applicantRequest(), response());
        const record = admissions[0];
        const rejectResponse = response();
        await controller.update(
            { params: { id: record._id }, body: { admissionStatus: "Rejected" } },
            rejectResponse
        );

        assert.equal(rejectResponse.statusCode, 200);
        assert.equal(record.admissionStatus, "Rejected");
        assert.equal(students.length, 0);
    });

    it("leaves an admission unapproved when saving the student fails", async () => {
        await controller.create(applicantRequest(), response());
        students.push({
            _id: studentId,
            studentId: "STU-001",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.edu",
            async save() {
                throw new Error("Student write failed");
            }
        });

        const approveResponse = response();
        const originalConsoleError = console.error;
        console.error = () => {};
        try {
            await controller.approve({ params: { id: admissions[0]._id } }, approveResponse);
        } finally {
            console.error = originalConsoleError;
        }

        assert.equal(approveResponse.statusCode, 500);
        assert.equal(admissions[0].admissionStatus, "Applied");
        assert.equal(admissions[0].student, undefined);
    });

    it("updates an existing student instead of creating a duplicate", async () => {
        const existingStudent = {
            _id: studentId,
            studentId: "STU-001",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.edu",
            course: null,
            enrollmentStatus: "Graduated",
            async save() {
                return this;
            }
        };
        students.push(existingStudent);

        const createResponse = response();
        await controller.create(applicantRequest({ student: studentId }), createResponse);
        const approveResponse = response();
        await controller.approve({ params: { id: admissions[0]._id } }, approveResponse);

        assert.equal(approveResponse.statusCode, 200);
        assert.equal(students.length, 1);
        assert.equal(existingStudent.course, courseId);
        assert.equal(existingStudent.enrollmentStatus, "Active");
        assert.equal(admissions[0].student, studentId);
    });
});
