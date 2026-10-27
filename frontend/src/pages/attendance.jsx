import { useEffect, useState } from "react";
import { getAllCourses } from "../services/courseService";
import {
    getCourseAttendance,
    markCourseAttendance
} from "../services/academicRecordService";
import "./students.css";
import "./attendance.css";

const today = () => new Date().toISOString().slice(0, 10);

function Attendance() {
    const [courses, setCourses] = useState([]);
    const [courseId, setCourseId] = useState("");
    const [date, setDate] = useState(today());
    const [roster, setRoster] = useState({ key: "", students: [], statuses: {} });
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const rosterKey = `${courseId}:${date}`;
    const rosterIsCurrent = roster.key === rosterKey;
    const students = rosterIsCurrent ? roster.students : [];
    const statuses = rosterIsCurrent ? roster.statuses : {};
    const loadingRoster = Boolean(courseId && date && !rosterIsCurrent);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await getAllCourses();
                const loadedCourses = data.courses || [];
                setCourses(loadedCourses);
                if (loadedCourses.length > 0) {
                    setCourseId(loadedCourses[0]._id);
                }
            } catch (loadError) {
                console.error("Error loading courses for attendance:", loadError);
                setError(loadError.response?.data?.message || "Unable to load courses. Please try again.");
            } finally {
                setLoadingCourses(false);
            }
        };
        loadCourses();
    }, []);

    useEffect(() => {
        if (!courseId || !date) {
            return undefined;
        }

        let cancelled = false;
        const loadRoster = async () => {
            try {
                const data = await getCourseAttendance(courseId, date);
                if (cancelled) return;

                setRoster({
                    key: rosterKey,
                    students: data.students || [],
                    statuses: Object.fromEntries(
                        (data.students || []).map((student) => {
                        const record = (data.attendance || []).find(
                            (entry) => (entry.student?._id || entry.student) === student._id
                        );
                        return [student._id, record?.status || ""];
                    })
                    )
                });
            } catch (loadError) {
                if (cancelled) return;
                console.error("Error loading course attendance:", loadError);
                setRoster({ key: rosterKey, students: [], statuses: {} });
                setError(loadError.response?.data?.message || "Unable to load students for this course.");
            }
        };
        loadRoster();

        return () => {
            cancelled = true;
        };
    }, [courseId, date, rosterKey]);

    const markedCount = students.filter((student) => statuses[student._id]).length;
    const presentCount = students.filter((student) => statuses[student._id] === "Present").length;
    const absentCount = markedCount - presentCount;
    const allMarked = students.length > 0 && markedCount === students.length;

    const markAll = (status) => {
        setRoster((previous) => ({
            ...previous,
            statuses: Object.fromEntries(students.map((student) => [student._id, status]))
        }));
        setMessage("");
    };

    const handleSave = async (event) => {
        event.preventDefault();
        if (!allMarked) return;

        setSaving(true);
        setError("");
        setMessage("");
        try {
            const result = await markCourseAttendance(courseId, {
                date,
                entries: students.map((student) => ({
                    student: student._id,
                    status: statuses[student._id]
                }))
            });
            setMessage(result.message || "Attendance saved successfully.");
        } catch (saveError) {
            console.error("Error saving course attendance:", saveError.response?.data || saveError.message);
            setError(saveError.response?.data?.message || "Unable to save attendance. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const selectedCourse = courses.find((course) => course._id === courseId);

    if (loadingCourses) {
        return <div className="page-state" role="status"><span className="loading-spinner" />Loading courses…</div>;
    }

    return (
        <div className="attendance-page">
            <section className="page-intro">
                <div>
                    <h2>Course attendance</h2>
                    <p>Select a course and date to mark attendance for its enrolled students.</p>
                </div>
            </section>

            {error && <p className="attendance-feedback attendance-feedback-error" role="alert">{error}</p>}
            {message && <p className="attendance-feedback attendance-feedback-success" role="status">{message}</p>}

            <section className="panel attendance-filter-panel">
                <div className="attendance-filters">
                    <label className="form-field">
                        <span>Course</span>
                        <select value={courseId} onChange={(event) => setCourseId(event.target.value)} disabled={courses.length === 0 || saving}>
                            {courses.length === 0 ? (
                                <option value="">No courses available</option>
                            ) : courses.map((course) => (
                                <option key={course._id} value={course._id}>{course.courseCode} — {course.courseName}</option>
                            ))}
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Attendance date</span>
                        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={saving} />
                    </label>
                    <div className="attendance-filter-course">
                        {selectedCourse ? (
                            <>
                                <span>Selected course</span>
                                <strong>{selectedCourse.courseName}</strong>
                            </>
                        ) : <span>Select a course to load its students.</span>}
                    </div>
                </div>
            </section>

            <section className="attendance-summary" aria-label="Attendance summary">
                <article className="summary-card">
                    <span className="summary-icon summary-icon-indigo" aria-hidden="true">S</span>
                    <div><p>Enrolled students</p><strong>{students.length}</strong></div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-green" aria-hidden="true">P</span>
                    <div><p>Present</p><strong>{presentCount}</strong></div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-amber" aria-hidden="true">A</span>
                    <div><p>Absent</p><strong>{absentCount}</strong></div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-blue" aria-hidden="true">✓</span>
                    <div><p>Marked</p><strong>{markedCount} / {students.length}</strong></div>
                </article>
            </section>

            <section className="panel attendance-table-panel">
                <div className="table-toolbar">
                    <div>
                        <h3>{selectedCourse ? `${selectedCourse.courseName} roster` : "Course roster"}</h3>
                        <p>{loadingRoster ? "Loading student roster…" : `${students.length} ${students.length === 1 ? "student" : "students"} · ${new Date(`${date}T00:00:00`).toLocaleDateString()}`}</p>
                    </div>
                    <div className="attendance-toolbar-actions">
                        <button type="button" className="secondary-button" onClick={() => markAll("Present")} disabled={!students.length || loadingRoster || saving}>Mark all present</button>
                        <button type="button" className="secondary-button" onClick={() => markAll("Absent")} disabled={!students.length || loadingRoster || saving}>Mark all absent</button>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div className="table-scroll">
                        <table className="data-table attendance-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Student ID</th>
                                    <th>Enrollment</th>
                                    <th>Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRoster ? (
                                    <tr><td colSpan="4" className="academic-empty">Loading course roster…</td></tr>
                                ) : students.length === 0 ? (
                                    <tr><td colSpan="4" className="academic-empty">{selectedCourse ? "No students are assigned to this course yet." : "Select a course to view its students."}</td></tr>
                                ) : students.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <strong>{student.firstName} {student.lastName}</strong>
                                            <span className="attendance-student-email">{student.email}</span>
                                        </td>
                                        <td>{student.studentId}</td>
                                        <td>{student.enrollmentStatus || "Active"}</td>
                                        <td>
                                            <div
                                                className="attendance-status-control"
                                                role="group"
                                                aria-label={`Attendance status for ${student.firstName} ${student.lastName}`}
                                            >
                                                {["Present", "Absent"].map((status) => (
                                                    <button
                                                        key={status}
                                                        type="button"
                                                        className={`attendance-status-button attendance-status-${status.toLowerCase()}${statuses[student._id] === status ? " attendance-status-selected" : ""}`}
                                                        aria-pressed={statuses[student._id] === status}
                                                        onClick={() => {
                                                            setRoster((previous) => ({
                                                                ...previous,
                                                                statuses: { ...previous.statuses, [student._id]: status }
                                                            }));
                                                            setMessage("");
                                                        }}
                                                        disabled={loadingRoster || saving}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="attendance-save-row">
                        {!allMarked && students.length > 0 && (
                            <span>{students.length - markedCount} student{students.length - markedCount === 1 ? "" : "s"} still need attendance marked.</span>
                        )}
                        <button type="submit" className="primary-button" disabled={!allMarked || loadingRoster || saving}>
                            {saving ? "Saving attendance…" : "Save attendance"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default Attendance;
