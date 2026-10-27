const { beforeEach, describe, it } = require("node:test");
const assert = require("node:assert/strict");

const courseId = "aaaaaaaaaaaaaaaaaaaaaaaa";
const studentOneId = "bbbbbbbbbbbbbbbbbbbbbbbb";
const studentTwoId = "cccccccccccccccccccccccc";
const otherStudentId = "dddddddddddddddddddddddd";
const students = [];
const attendance = [];

const toId = (value) => String(value?._id || value || "");

class MockQuery {
    constructor(value) {
        this.value = value;
    }

    select() {
        return this;
    }

    sort() {
        return this;
    }

    then(resolve, reject) {
        return Promise.resolve(this.value).then(resolve, reject);
    }
}

const Course = {
    findById(id) {
        return new MockQuery(toId(id) === courseId ? { _id: courseId, courseCode: "CS", courseName: "Computer Science" } : null);
    }
};

const Student = {
    find(filter) {
        let matches = students;
        if (filter.course) {
            matches = matches.filter((student) => toId(student.course) === toId(filter.course));
        }
        if (filter._id?.$in) {
            const ids = filter._id.$in.map(toId);
            matches = matches.filter((student) => ids.includes(toId(student._id)));
        }
        return new MockQuery(matches);
    }
};

const Attendance = {
    find(filter) {
        const ids = filter.student.$in.map(toId);
        const matches = attendance.filter((record) =>
            ids.includes(toId(record.student)) &&
            record.date >= filter.date.$gte &&
            record.date < filter.date.$lt
        );
        return new MockQuery(matches);
    },
    async bulkWrite(operations) {
        for (const operation of operations) {
            const { student, date } = operation.updateOne.filter;
            const values = operation.updateOne.update.$set;
            const existing = attendance.find((record) => toId(record.student) === toId(student) && record.date.getTime() === date.getTime());
            if (existing) {
                existing.status = values.status;
            } else {
                attendance.push({ student, date, status: values.status });
            }
        }
    }
};

require.cache[require.resolve("../models/attendance")] = { exports: Attendance };
require.cache[require.resolve("../models/course")] = { exports: Course };
require.cache[require.resolve("../models/student")] = { exports: Student };

const controller = require("../controllers/attendanceController");

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

describe("course attendance", () => {
    beforeEach(() => {
        students.length = 0;
        attendance.length = 0;
        students.push(
            { _id: studentOneId, studentId: "STU-001", firstName: "Ada", lastName: "Lovelace", course: courseId },
            { _id: studentTwoId, studentId: "STU-002", firstName: "Grace", lastName: "Hopper", course: courseId },
            { _id: otherStudentId, studentId: "STU-003", firstName: "Alan", lastName: "Turing", course: "eeeeeeeeeeeeeeeeeeeeeeee" }
        );
    });

    it("loads only the selected course roster and existing attendance for the date", async () => {
        attendance.push({
            student: studentOneId,
            date: new Date("2026-10-27T00:00:00.000Z"),
            status: "Present"
        });
        const res = response();

        await controller.getCourseAttendance({
            params: { courseId },
            query: { date: "2026-10-27" }
        }, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.students.length, 2);
        assert.equal(res.body.attendance.length, 1);
        assert.equal(res.body.attendance[0].status, "Present");
    });

    it("marks the submitted roster and updates existing attendance instead of duplicating it", async () => {
        const req = {
            params: { courseId },
            body: {
                date: "2026-10-27",
                entries: [
                    { student: studentOneId, status: "Present" },
                    { student: studentTwoId, status: "Absent" }
                ]
            }
        };
        const firstResponse = response();
        await controller.markCourseAttendance(req, firstResponse);
        const secondResponse = response();
        await controller.markCourseAttendance(req, secondResponse);

        assert.equal(firstResponse.statusCode, 200);
        assert.equal(secondResponse.statusCode, 200);
        assert.equal(attendance.length, 2);
        assert.equal(attendance.find((record) => toId(record.student) === studentOneId).status, "Present");
        assert.equal(attendance.find((record) => toId(record.student) === studentTwoId).status, "Absent");
    });

    it("rejects students who are not assigned to the selected course", async () => {
        const res = response();
        await controller.markCourseAttendance({
            params: { courseId },
            body: {
                date: "2026-10-27",
                entries: [{ student: otherStudentId, status: "Present" }]
            }
        }, res);

        assert.equal(res.statusCode, 400);
        assert.equal(attendance.length, 0);
    });

    it("requires one status for every student in the selected course", async () => {
        const res = response();
        await controller.markCourseAttendance({
            params: { courseId },
            body: {
                date: "2026-10-27",
                entries: [{ student: studentOneId, status: "Present" }]
            }
        }, res);

        assert.equal(res.statusCode, 400);
        assert.equal(attendance.length, 0);
    });

    it("rejects invalid dates and duplicate student entries", async () => {
        const invalidDateResponse = response();
        await controller.markCourseAttendance({
            params: { courseId },
            body: { date: "2026-99-99", entries: [{ student: studentOneId, status: "Present" }] }
        }, invalidDateResponse);

        const duplicateResponse = response();
        await controller.markCourseAttendance({
            params: { courseId },
            body: {
                date: "2026-10-27",
                entries: [
                    { student: studentOneId, status: "Present" },
                    { student: studentOneId, status: "Absent" }
                ]
            }
        }, duplicateResponse);

        assert.equal(invalidDateResponse.statusCode, 400);
        assert.equal(duplicateResponse.statusCode, 400);
        assert.equal(attendance.length, 0);
    });
});
