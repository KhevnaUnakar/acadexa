import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api"
});

const isNotFound = (error) => error.response?.status === 404;
const getReferenceId = (reference) => reference?._id || reference;
const getDateKey = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const getLegacyCourseAttendance = async (courseId, date) => {
    const [courseResponse, studentResponse, attendanceResponse] = await Promise.all([
        API.get("/courses"),
        API.get("/students"),
        API.get("/attendance")
    ]);

    const course = (courseResponse.data.courses || []).find((item) => item._id === courseId);
    if (!course) {
        throw new Error("Course not found.");
    }

    const students = (studentResponse.data.students || []).filter(
        (student) => getReferenceId(student.course) === courseId
    );
    const studentIds = new Set(students.map((student) => student._id));
    const attendance = (attendanceResponse.data.records || []).filter((record) =>
        studentIds.has(getReferenceId(record.student)) && getDateKey(record.date) === date
    );

    return { course, date, students, attendance };
};

export const getAcademicRecords = async (resource) => {
    const response = await API.get(`/${resource}`);
    return response.data;
};

export const getCourseAttendance = async (courseId, date) => {
    try {
        const response = await API.get(`/attendance/course/${courseId}`, { params: { date } });
        return response.data;
    } catch (error) {
        if (!isNotFound(error)) {
            throw error;
        }
        return getLegacyCourseAttendance(courseId, date);
    }
};

export const markCourseAttendance = async (courseId, data) => {
    try {
        const response = await API.post(`/attendance/course/${courseId}/mark`, data);
        return response.data;
    } catch (error) {
        if (!isNotFound(error)) {
            throw error;
        }

        const current = await getLegacyCourseAttendance(courseId, data.date);
        const existingByStudent = new Map(
            current.attendance.map((record) => [getReferenceId(record.student), record])
        );
        await Promise.all(data.entries.map((entry) => {
            const existing = existingByStudent.get(entry.student);
            const record = { student: entry.student, date: data.date, status: entry.status };
            return existing
                ? API.put(`/attendance/${existing._id}`, record)
                : API.post("/attendance", record);
        }));

        return { message: `Attendance saved for ${data.entries.length} students.` };
    }
};

export const createAcademicRecord = async (resource, data) => {
    const response = await API.post(`/${resource}`, data);
    return response.data;
};

export const updateAcademicRecord = async (resource, id, data) => {
    const response = await API.put(`/${resource}/${id}`, data);
    return response.data;
};

export const approveAdmission = async (id) => {
    const response = await API.post(`/admissions/${id}/approve`);
    return response.data;
};

export const deleteAcademicRecord = async (resource, id) => {
    const response = await API.delete(`/${resource}/${id}`);
    return response.data;
};
