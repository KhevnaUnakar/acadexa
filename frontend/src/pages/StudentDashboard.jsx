import { useEffect, useMemo, useState } from "react";
import { getAllStudents } from "../services/studentService";
import { getAllFees } from "../services/feeService";
import { getAcademicRecords } from "../services/academicRecordService";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value || 0));

export default function StudentDashboard({ onNavigate }) {
    const [students, setStudents] = useState([]);
    const [fees, setFees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [examinations, setExaminations] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStudentPortal = async () => {
            try {
                const [studentData, feeData, attendanceData, examData] = await Promise.all([
                    getAllStudents(),
                    getAllFees(),
                    getAcademicRecords("attendance"),
                    getAcademicRecords("examinations")
                ]);

                const loadedStudents = studentData.students || [];
                setStudents(loadedStudents);
                setFees(feeData.fees || []);
                setAttendance(attendanceData.records || []);
                setExaminations(examData.records || []);

                if (loadedStudents.length > 0) {
                    setSelectedStudentId(loadedStudents[0]._id);
                }
            } catch (fetchError) {
                console.error("Error fetching student dashboard data:", fetchError);
                setError("Unable to load the student dashboard. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudentPortal();
    }, []);

    const selectedStudent = useMemo(
        () => students.find((student) => student._id === selectedStudentId) || students[0] || null,
        [students, selectedStudentId]
    );

    const selectedFee = fees.filter((fee) => {
        const studentId = fee.student?._id || fee.student;
        return studentId === selectedStudent?._id;
    });

    const selectedAttendance = attendance.filter((entry) => {
        const studentId = entry.student?._id || entry.student;
        return studentId === selectedStudent?._id;
    });

    const selectedExaminations = examinations.filter((entry) => {
        const studentId = entry.student?._id || entry.student;
        return studentId === selectedStudent?._id;
    });

    const attendanceRate = selectedAttendance.length
        ? Math.round(
              (selectedAttendance.filter((entry) => entry.status === "Present").length /
                  selectedAttendance.length) *
                  100
          )
        : 0;

    const averageGrade = selectedExaminations.length
        ? Math.round(
              selectedExaminations.reduce((total, exam) => {
                  if (exam.totalMarks && exam.marksObtained !== undefined && exam.marksObtained !== null) {
                      return total + (Number(exam.marksObtained) / Number(exam.totalMarks)) * 100;
                  }
                  return total;
              }, 0) / selectedExaminations.length
          )
        : 0;

    if (loading) {
        return <div className="page-state" role="status"><span className="loading-spinner" />Loading student dashboard…</div>;
    }

    if (error) {
        return <div className="page-state page-state-error" role="alert">{error}</div>;
    }

    if (!selectedStudent) {
        return <div className="page-state page-state-error" role="alert">No student record is available for the student portal.</div>;
    }

    return (
        <div className="page-shell student-dashboard-shell">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Student experience</p>
                    <h2>Student dashboard</h2>
                </div>
                <div className="page-header-actions">
                    <button type="button" className="secondary-button" onClick={() => onNavigate("dashboard")}>Back to admin</button>
                </div>
            </header>

            <div className="student-portal-banner">
                <div>
                    <p className="eyebrow">Demo preview</p>
                    <strong>Student dashboard is available for review.</strong>
                    <span>No authentication layer exists yet, so this preview should be protected before public use.</span>
                </div>
            </div>

            <div className="student-portal-header panel panel-block">
                <div className="student-profile-summary">
                    <span className="profile-avatar">{selectedStudent.firstName?.slice(0, 1) || "S"}{selectedStudent.lastName?.slice(0, 1) || "T"}</span>
                    <div>
                        <p className="eyebrow">Student profile</p>
                        <h3>{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                        <span>{selectedStudent.studentId} · {selectedStudent.email}</span>
                    </div>
                </div>

                <label className="student-select-control">
                    <span>Student</span>
                    <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                        {students.map((student) => (
                            <option key={student._id} value={student._id}>
                                {student.studentId} · {student.firstName} {student.lastName}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <section className="stats-grid">
                <article className="summary-card">
                    <span className="summary-icon summary-icon-indigo" aria-hidden="true">P</span>
                    <div>
                        <p>Enrollment</p>
                        <strong>{selectedStudent.enrollmentStatus || "Active"}</strong>
                        <small>{selectedStudent.semester ? `Semester ${selectedStudent.semester}` : "Semester pending"}</small>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-blue" aria-hidden="true">A</span>
                    <div>
                        <p>Attendance</p>
                        <strong>{attendanceRate}%</strong>
                        <small>{selectedAttendance.length} entries</small>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-green" aria-hidden="true">G</span>
                    <div>
                        <p>Average marks</p>
                        <strong>{averageGrade}%</strong>
                        <small>{selectedExaminations.length} assessments</small>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-amber" aria-hidden="true">₹</span>
                    <div>
                        <p>Fee status</p>
                        <strong>{selectedFee.length ? selectedFee[0].paymentStatus : "Pending"}</strong>
                        <small>{selectedFee.length ? formatCurrency(selectedFee[0].balance) : "No fee record"}</small>
                    </div>
                </article>
            </section>

            <div className="dashboard-grid">
                <section className="panel panel-block">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Profile</p>
                            <h3>Student information</h3>
                        </div>
                    </div>
                    <div className="student-detail-list">
                        <div><span>Phone</span><strong>{selectedStudent.phone || "—"}</strong></div>
                        <div><span>Course</span><strong>{selectedStudent.course ? selectedStudent.course.courseName || selectedStudent.course : "Not assigned"}</strong></div>
                        <div><span>Department</span><strong>{selectedStudent.department ? selectedStudent.department.departmentName || selectedStudent.department : "Not assigned"}</strong></div>
                    </div>
                </section>

                <section className="panel panel-block">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Finance</p>
                            <h3>Fee summary</h3>
                        </div>
                    </div>
                    {selectedFee.length === 0 ? (
                        <div className="empty-state">No fee record exists for this student.</div>
                    ) : (
                        <div className="fee-summary-list">
                            <div>
                                <span>Total fee</span>
                                <strong>{formatCurrency(selectedFee[0].totalFee)}</strong>
                            </div>
                            <div>
                                <span>Paid</span>
                                <strong>{formatCurrency(selectedFee[0].paidAmount)}</strong>
                            </div>
                            <div>
                                <span>Balance</span>
                                <strong>{formatCurrency(selectedFee[0].balance)}</strong>
                            </div>
                            <div>
                                <span>Status</span>
                                <strong>{selectedFee[0].paymentStatus}</strong>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <div className="dashboard-grid">
                <section className="panel panel-block">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Attendance</p>
                            <h3>Attendance summary</h3>
                        </div>
                    </div>
                    {selectedAttendance.length === 0 ? (
                        <div className="empty-state">No attendance records available.</div>
                    ) : (
                        <ul className="simple-list">
                            {selectedAttendance.slice(0, 6).map((entry) => (
                                <li key={entry._id}>
                                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                                    <strong>{entry.status}</strong>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="panel panel-block">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Exams</p>
                            <h3>Assessment results</h3>
                        </div>
                    </div>
                    {selectedExaminations.length === 0 ? (
                        <div className="empty-state">No exam results available.</div>
                    ) : (
                        <ul className="simple-list">
                            {selectedExaminations.slice(0, 6).map((exam) => (
                                <li key={exam._id}>
                                    <span>{exam.subject}</span>
                                    <strong>{exam.result}</strong>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
