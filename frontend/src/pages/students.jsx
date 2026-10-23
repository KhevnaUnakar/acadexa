import { useEffect, useState } from "react";
import {
    getAllStudents,
    createStudent,
    updateStudent,
    deleteStudent
} from "../services/studentService";
import { getAllCourses } from "../services/courseService";
import "./students.css";

const emptyStudent = {
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    semester: "",
    course: "",
    enrollmentStatus: "Active"
};

function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showForm, setShowForm] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [formData, setFormData] = useState(emptyStudent);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    const refreshStudents = async () => {
        const data = await getAllStudents();
        setStudents(data.students);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentData, courseData] = await Promise.all([
                    getAllStudents(),
                    getAllCourses()
                ]);
                setStudents(studentData.students);
                setCourses(courseData.courses);
            } catch (err) {
                console.error("Error fetching student data:", err);
                setError("Unable to fetch student data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const activeCount = students.filter((student) => student.enrollmentStatus === "Active").length;
    const graduatedCount = students.filter((student) => student.enrollmentStatus === "Graduated").length;
    const discontinuedCount = students.filter((student) => student.enrollmentStatus === "Discontinued").length;

    const filteredStudents = students.filter((student) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
            (student.studentId || "").toLowerCase().includes(query) ||
            (student.firstName || "").toLowerCase().includes(query) ||
            (student.lastName || "").toLowerCase().includes(query) ||
            (student.email || "").toLowerCase().includes(query) ||
            (student.phone || "").toLowerCase().includes(query);
        const matchesStatus =
            statusFilter === "All" ||
            (student.enrollmentStatus || "Active") === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const openCreateForm = () => {
        setFormData(emptyStudent);
        setEditingStudentId(null);
        setFormError("");
        setShowForm(true);
    };

    const handleEditStudent = (student) => {
        setFormData({
            studentId: student.studentId || "",
            firstName: student.firstName || "",
            lastName: student.lastName || "",
            email: student.email || "",
            phone: student.phone || "",
            semester: student.semester ?? "",
            enrollmentStatus: student.enrollmentStatus || "Active",
            course: student.course?._id || student.course || ""
        });
        setEditingStudentId(student._id);
        setFormError("");
        setShowForm(true);
    };

    const handleSaveStudent = async (event) => {
        event.preventDefault();
        setFormError("");
        setSaving(true);

        const studentData = {
            ...formData,
            semester: formData.semester === "" ? undefined : Number(formData.semester),
            course: formData.course || null
        };

        try {
            if (editingStudentId) {
                await updateStudent(editingStudentId, studentData);
            } else {
                await createStudent(studentData);
            }
            await refreshStudents();
            setShowForm(false);
            setEditingStudentId(null);
            setFormData(emptyStudent);
        } catch (err) {
            console.error("Error saving student:", err.response?.data || err.message);
            setFormError(
                err.response?.data?.message ||
                `Unable to ${editingStudentId ? "update" : "create"} student. Please try again.`
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStudent = async (student) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${student.firstName} ${student.lastName}"?`
        );
        if (!confirmed) return;

        try {
            await deleteStudent(student._id);
            await refreshStudents();
        } catch (err) {
            console.error("Error deleting student:", err.response?.data || err.message);
            window.alert(err.response?.data?.message || "Unable to delete student. Please try again.");
        }
    };

    if (loading) {
        return <div className="page-state" role="status"><span className="loading-spinner" />Loading student records…</div>;
    }
    if (error) {
        return <div className="page-state page-state-error" role="alert">{error}</div>;
    }

    return (
        <div className="students-page">
            <section className="page-intro">
                <div>
                    <h2>Student Directory</h2>
                    <p>Keep track of student records, enrollment, and course assignments.</p>
                </div>
                <button type="button" className="primary-button" onClick={openCreateForm}>
                    <span aria-hidden="true">+</span> Add student
                </button>
            </section>

            <section className="student-stats" aria-label="Student enrollment overview">
                <article className="summary-card">
                    <span className="summary-icon summary-icon-indigo" aria-hidden="true">01</span>
                    <div><p>Total students</p><strong>{students.length}</strong></div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-green" aria-hidden="true">A</span>
                    <div><p>Active</p><strong>{activeCount}</strong></div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-blue" aria-hidden="true">G</span>
                    <div><p>Graduated</p><strong>{graduatedCount}</strong></div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-amber" aria-hidden="true">D</span>
                    <div><p>Discontinued</p><strong>{discontinuedCount}</strong></div>
                </article>
            </section>

            {showForm && (
                <section className="panel student-form-panel" aria-labelledby="student-form-title">
                    <div className="form-panel-heading">
                        <div>
                            <h3 id="student-form-title">{editingStudentId ? "Edit student" : "Add a student"}</h3>
                            <p>Enter the student details below.</p>
                        </div>
                    </div>
                    <form onSubmit={handleSaveStudent}>
                        <div className="student-form-grid">
                            <div className="form-field">
                                <label htmlFor="studentId">Student ID <span>*</span></label>
                                <input id="studentId" value={formData.studentId} onChange={(event) => setFormData({ ...formData, studentId: event.target.value })} required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="firstName">First name <span>*</span></label>
                                <input id="firstName" value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="lastName">Last name <span>*</span></label>
                                <input id="lastName" value={formData.lastName} onChange={(event) => setFormData({ ...formData, lastName: event.target.value })} required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="studentEmail">Email address <span>*</span></label>
                                <input id="studentEmail" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="studentPhone">Phone</label>
                                <input id="studentPhone" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
                            </div>
                            <div className="form-field">
                                <label htmlFor="semester">Semester</label>
                                <input id="semester" type="number" min="1" max="8" value={formData.semester} onChange={(event) => setFormData({ ...formData, semester: event.target.value })} />
                            </div>
                            <div className="form-field">
                                <label htmlFor="studentCourse">Assigned course</label>
                                <select id="studentCourse" value={formData.course} onChange={(event) => setFormData({ ...formData, course: event.target.value })}>
                                    <option value="">No course assigned</option>
                                    {courses.map((course) => <option key={course._id} value={course._id}>{course.courseCode} - {course.courseName}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label htmlFor="enrollmentStatus">Enrollment status</label>
                                <select id="enrollmentStatus" value={formData.enrollmentStatus} onChange={(event) => setFormData({ ...formData, enrollmentStatus: event.target.value })}>
                                    <option value="Active">Active</option>
                                    <option value="Graduated">Graduated</option>
                                    <option value="Discontinued">Discontinued</option>
                                </select>
                            </div>
                        </div>
                        {formError && <p className="form-error" role="alert">{formError}</p>}
                        <div className="form-actions">
                            <button type="button" className="secondary-button" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : editingStudentId ? "Update student" : "Save student"}</button>
                        </div>
                    </form>
                </section>
            )}

            <section className="panel student-table-panel">
                <div className="table-toolbar">
                    <div>
                        <h3>All students</h3>
                        <p>{filteredStudents.length} {filteredStudents.length === 1 ? "record" : "records"}</p>
                    </div>
                    <div className="student-filters">
                        <label className="search-control">
                            <span className="search-symbol" aria-hidden="true" />
                            <span className="visually-hidden">Search students</span>
                            <input type="search" placeholder="Search students…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                        </label>
                        <label>
                            <span className="visually-hidden">Filter by enrollment status</span>
                            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                <option value="All">All statuses</option>
                                <option value="Active">Active</option>
                                <option value="Graduated">Graduated</option>
                                <option value="Discontinued">Discontinued</option>
                            </select>
                        </label>
                    </div>
                </div>
                <div className="table-scroll">
                    <table className="data-table student-table">
                        <thead>
                            <tr><th>Student</th><th>Student ID</th><th>Email</th><th>Phone</th><th>Semester</th><th>Course</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan="8"><div className="table-empty"><span className="empty-icon" aria-hidden="true">⌕</span><strong>{students.length ? "No matching students" : "No students yet"}</strong><p>{students.length ? "Try changing your search or status filter." : "Add a student to start building your directory."}</p></div></td></tr>
                            ) : filteredStudents.map((student) => {
                                const assignedCourse = courses.find((course) => course._id === (student.course?._id || student.course));
                                const status = student.enrollmentStatus || "Active";
                                return (
                                    <tr key={student._id}>
                                        <td><span className="student-name">{student.firstName} {student.lastName}</span></td>
                                        <td><span className="student-id">{student.studentId}</span></td>
                                        <td>{student.email}</td>
                                        <td>{student.phone || "—"}</td>
                                        <td>{student.semester ?? "—"}</td>
                                        <td className="student-course-cell">{assignedCourse ? `${assignedCourse.courseCode} · ${assignedCourse.courseName}` : "—"}</td>
                                        <td><span className={`status-badge status-${status.toLowerCase()}`}>{status}</span></td>
                                        <td><div className="row-actions">
                                            <button type="button" className="text-action" onClick={() => handleEditStudent(student)} aria-label={`Edit ${student.firstName} ${student.lastName}`}>Edit</button>
                                            <button type="button" className="text-action text-action-danger" onClick={() => handleDeleteStudent(student)} aria-label={`Delete ${student.firstName} ${student.lastName}`}>Delete</button>
                                        </div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default Students;
