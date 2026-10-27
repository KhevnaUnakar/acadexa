import { useEffect, useMemo, useState } from "react";
import { getAllStudents } from "../services/studentService";
import { getAllCourses } from "../services/courseService";
import {
    approveAdmission,
    createAcademicRecord,
    deleteAcademicRecord,
    getAcademicRecords,
    updateAcademicRecord
} from "../services/academicRecordService";
import "./academicRecords.css";
import "./admissions.css";

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({
    applicantType: "new",
    student: "",
    applicantFirstName: "",
    applicantLastName: "",
    applicantEmail: "",
    applicantPhone: "",
    course: "",
    admissionDate: today(),
    admissionStatus: "Applied"
});

const applicantName = (record) => {
    const student = record.student && typeof record.student === "object" ? record.student : null;
    return student
        ? `${student.firstName} ${student.lastName}`
        : `${record.applicantFirstName || ""} ${record.applicantLastName || ""}`.trim() || "Applicant";
};

function Admissions() {
    const [records, setRecords] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState("");
    const [formData, setFormData] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [message, setMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState("");
    const [search, setSearch] = useState("");

    const refreshData = async () => {
        const [admissionData, studentData] = await Promise.all([
            getAcademicRecords("admissions"),
            getAllStudents()
        ]);
        setRecords(admissionData.records || []);
        setStudents(studentData.students || []);
    };

    useEffect(() => {
        const loadPage = async () => {
            try {
                const [admissionData, studentData, courseData] = await Promise.all([
                    getAcademicRecords("admissions"),
                    getAllStudents(),
                    getAllCourses()
                ]);
                setRecords(admissionData.records || []);
                setStudents(studentData.students || []);
                setCourses(courseData.courses || []);
            } catch (error) {
                console.error("Error loading admissions:", error);
                setLoadError(error.response?.data?.message || "Unable to load admissions. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        loadPage();
    }, []);

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return records;
        return records.filter((record) => {
            const course = record.course;
            const student = record.student;
            return [
                applicantName(record),
                record.applicantEmail,
                record.applicantPhone,
                student?.studentId,
                course?.courseCode,
                course?.courseName,
                record.admissionStatus
            ].some((value) => String(value || "").toLowerCase().includes(query));
        });
    }, [records, search]);

    const openCreateForm = () => {
        setEditingId("");
        setFormData(emptyForm());
        setFormError("");
        setMessage("");
        setFormOpen(true);
    };

    const openEditForm = (record) => {
        const student = record.student && typeof record.student === "object" ? record.student : null;
        setEditingId(record._id);
        setFormData({
            applicantType: student ? "existing" : "new",
            student: student?._id || "",
            applicantFirstName: record.applicantFirstName || student?.firstName || "",
            applicantLastName: record.applicantLastName || student?.lastName || "",
            applicantEmail: record.applicantEmail || student?.email || "",
            applicantPhone: record.applicantPhone || student?.phone || "",
            course: record.course?._id || record.course || "",
            admissionDate: record.admissionDate ? new Date(record.admissionDate).toISOString().slice(0, 10) : today(),
            admissionStatus: record.admissionStatus || "Applied"
        });
        setFormError("");
        setMessage("");
        setFormOpen(true);
    };

    const changeStudent = (studentId) => {
        const student = students.find((item) => item._id === studentId);
        setFormData((previous) => ({
            ...previous,
            student: studentId,
            applicantFirstName: student?.firstName || "",
            applicantLastName: student?.lastName || "",
            applicantEmail: student?.email || "",
            applicantPhone: student?.phone || ""
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFormError("");
        setMessage("");
        setActionError("");

        const data = {
            student: formData.applicantType === "existing" ? formData.student : "",
            applicantFirstName: formData.applicantFirstName.trim(),
            applicantLastName: formData.applicantLastName.trim(),
            applicantEmail: formData.applicantEmail.trim().toLowerCase(),
            applicantPhone: formData.applicantPhone.trim(),
            course: formData.course,
            admissionDate: formData.admissionDate,
            ...(editingId ? { admissionStatus: formData.admissionStatus } : {})
        };

        try {
            if (editingId) {
                await updateAcademicRecord("admissions", editingId, data);
            } else {
                await createAcademicRecord("admissions", data);
            }
        } catch (error) {
            console.error("Error saving admission:", error.response?.data || error.message);
            setFormError(error.response?.data?.message || "Unable to save admission. Please try again.");
            setSaving(false);
            return;
        }

        setFormOpen(false);
        setMessage(editingId ? "Admission updated successfully." : "Applicant added successfully.");
        setSaving(false);
        try {
            await refreshData();
        } catch (error) {
            console.error("Admission saved but records could not be refreshed:", error);
            setActionError("Admission saved successfully, but the list could not be refreshed. Reload the page to see the latest records.");
        }
    };

    const handleApprove = async (record) => {
        if (!window.confirm(`Approve ${applicantName(record)} and enroll them in this course?`)) return;
        setBusyId(record._id);
        setActionError("");
        setMessage("");
        try {
            const result = await approveAdmission(record._id);
            setMessage(result.message || "Admission approved and student enrolled.");
        } catch (error) {
            console.error("Error approving admission:", error.response?.data || error.message);
            setActionError(error.response?.data?.message || "Unable to approve admission. Please try again.");
            setBusyId("");
            return;
        }
        setBusyId("");
        try {
            await refreshData();
        } catch (error) {
            console.error("Admission approved but records could not be refreshed:", error);
            setActionError("Admission approved successfully, but the list could not be refreshed. Reload the page to see the enrolled student.");
        }
    };

    const handleReject = async (record) => {
        if (!window.confirm(`Reject the application from ${applicantName(record)}?`)) return;
        setBusyId(record._id);
        setActionError("");
        setMessage("");
        try {
            await updateAcademicRecord("admissions", record._id, { admissionStatus: "Rejected" });
            setMessage("Admission rejected. No student record was created.");
        } catch (error) {
            console.error("Error rejecting admission:", error.response?.data || error.message);
            setActionError(error.response?.data?.message || "Unable to reject admission. Please try again.");
            setBusyId("");
            return;
        }
        setBusyId("");
        try {
            await refreshData();
        } catch (error) {
            console.error("Admission rejected but records could not be refreshed:", error);
            setActionError("Admission rejected successfully, but the list could not be refreshed. Reload the page to see the latest records.");
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Delete the admission application for ${applicantName(record)}?`)) return;
        setBusyId(record._id);
        setActionError("");
        setMessage("");
        try {
            await deleteAcademicRecord("admissions", record._id);
            setMessage("Admission application deleted.");
        } catch (error) {
            console.error("Error deleting admission:", error.response?.data || error.message);
            setActionError(error.response?.data?.message || "Unable to delete admission. Please try again.");
            setBusyId("");
            return;
        }
        setBusyId("");
        try {
            await refreshData();
        } catch (error) {
            console.error("Admission deleted but records could not be refreshed:", error);
            setActionError("Admission deleted successfully, but the list could not be refreshed. Reload the page to see the latest records.");
        }
    };

    if (loading) {
        return <div className="page-state" role="status"><span className="loading-spinner" />Loading admissions…</div>;
    }
    if (loadError) {
        return <div className="page-state page-state-error" role="alert">{loadError}</div>;
    }

    return (
        <div className="academic-records-page admissions-page">
            <section className="page-intro">
                <div>
                    <h2>Admissions</h2>
                    <p>Review applications and enroll students when their admission is approved.</p>
                </div>
                <button type="button" className="primary-button" onClick={openCreateForm}>
                    <span aria-hidden="true">+</span> Add applicant
                </button>
            </section>

            {message && <p className="admission-feedback admission-success" role="status">{message}</p>}
            {actionError && <p className="admission-feedback admission-error" role="alert">{actionError}</p>}

            {formOpen && (
                <section className="panel academic-form-panel" aria-labelledby="admission-form-title">
                    <div className="form-panel-heading">
                        <div>
                            <h3 id="admission-form-title">{editingId ? "Edit admission application" : "New admission application"}</h3>
                            <p>Approval creates or activates the student record and assigns the selected course.</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="admission-form-type">
                            <span>Applicant type</span>
                            <label>
                                <input
                                    type="radio"
                                    name="applicantType"
                                    checked={formData.applicantType === "new"}
                                    onChange={() => setFormData((previous) => ({ ...previous, applicantType: "new", student: "" }))}
                                />
                                New applicant
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="applicantType"
                                    checked={formData.applicantType === "existing"}
                                    onChange={() => setFormData((previous) => ({ ...previous, applicantType: "existing" }))}
                                />
                                Existing student
                            </label>
                        </div>

                        <div className="academic-form-grid">
                            {formData.applicantType === "existing" ? (
                                <div className="form-field">
                                    <label htmlFor="admission-student">Student <span>*</span></label>
                                    <select
                                        id="admission-student"
                                        value={formData.student}
                                        required
                                        onChange={(event) => changeStudent(event.target.value)}
                                    >
                                        <option value="">Select an existing student</option>
                                        {students.map((student) => (
                                            <option key={student._id} value={student._id}>
                                                {student.studentId} — {student.firstName} {student.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div className="form-field">
                                        <label htmlFor="applicant-first-name">First name <span>*</span></label>
                                        <input id="applicant-first-name" value={formData.applicantFirstName} required onChange={(event) => setFormData({ ...formData, applicantFirstName: event.target.value })} />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="applicant-last-name">Last name <span>*</span></label>
                                        <input id="applicant-last-name" value={formData.applicantLastName} required onChange={(event) => setFormData({ ...formData, applicantLastName: event.target.value })} />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="applicant-email">Email <span>*</span></label>
                                        <input id="applicant-email" type="email" value={formData.applicantEmail} required onChange={(event) => setFormData({ ...formData, applicantEmail: event.target.value })} />
                                    </div>
                                    <div className="form-field">
                                        <label htmlFor="applicant-phone">Phone</label>
                                        <input id="applicant-phone" type="tel" value={formData.applicantPhone} onChange={(event) => setFormData({ ...formData, applicantPhone: event.target.value })} />
                                    </div>
                                </>
                            )}
                            <div className="form-field">
                                <label htmlFor="admission-course">Intended course <span>*</span></label>
                                <select id="admission-course" value={formData.course} required onChange={(event) => setFormData({ ...formData, course: event.target.value })}>
                                    <option value="">Select a course</option>
                                    {courses.map((course) => (
                                        <option key={course._id} value={course._id}>{course.courseCode} — {course.courseName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label htmlFor="admission-date">Application date <span>*</span></label>
                                <input id="admission-date" type="date" value={formData.admissionDate} required onChange={(event) => setFormData({ ...formData, admissionDate: event.target.value })} />
                            </div>
                            {editingId && (
                                <div className="form-field">
                                    <label htmlFor="admission-status">Status</label>
                                    <select id="admission-status" value={formData.admissionStatus} onChange={(event) => setFormData({ ...formData, admissionStatus: event.target.value })}>
                                        <option value="Applied">Applied</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        {formData.applicantType === "existing" && formData.student && (
                            <p className="admission-selected-student">
                                Using record for {formData.applicantFirstName} {formData.applicantLastName} ({formData.applicantEmail}).
                            </p>
                        )}
                        {formError && <p className="form-error" role="alert">{formError}</p>}
                        <div className="form-actions">
                            <button type="button" className="secondary-button" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
                            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Create application"}</button>
                        </div>
                    </form>
                </section>
            )}

            <section className="panel academic-table-panel">
                <div className="table-toolbar">
                    <div>
                        <h3>Admission applications</h3>
                        <p>{filteredRecords.length} {filteredRecords.length === 1 ? "application" : "applications"}</p>
                    </div>
                    <label className="admission-search">
                        <span className="visually-hidden">Search admission applications</span>
                        <input type="search" placeholder="Search applicants…" value={search} onChange={(event) => setSearch(event.target.value)} />
                    </label>
                </div>
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Course</th>
                                <th>Application date</th>
                                <th>Status</th>
                                <th>Linked student</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr><td colSpan="6" className="academic-empty">{records.length ? "No admissions match your search." : "No admission applications yet."}</td></tr>
                            ) : filteredRecords.map((record) => (
                                <tr key={record._id}>
                                    <td>
                                        <strong>{applicantName(record)}</strong>
                                        <span className="admission-applicant-meta">{record.applicantEmail || record.student?.email || "—"}</span>
                                    </td>
                                    <td>{record.course ? `${record.course.courseCode} — ${record.course.courseName}` : "—"}</td>
                                    <td>{record.admissionDate ? new Date(record.admissionDate).toLocaleDateString() : "—"}</td>
                                    <td><span className={`admission-status admission-status-${(record.admissionStatus || "Applied").toLowerCase()}`}>{record.admissionStatus || "Applied"}</span></td>
                                    <td>{record.student?.studentId ? `${record.student.studentId} · ${record.student.firstName} ${record.student.lastName}` : "Not enrolled"}</td>
                                    <td>
                                        <div className="row-actions admission-row-actions">
                                            {record.admissionStatus !== "Approved" && record.admissionStatus !== "Rejected" && (
                                                <>
                                                    <button type="button" className="text-action" disabled={busyId === record._id} onClick={() => handleApprove(record)}>{busyId === record._id ? "Working…" : "Approve"}</button>
                                                    <button type="button" className="text-action text-action-danger" disabled={busyId === record._id} onClick={() => handleReject(record)}>Reject</button>
                                                </>
                                            )}
                                            {record.admissionStatus !== "Approved" && (
                                                <button type="button" className="text-action" disabled={busyId === record._id} onClick={() => openEditForm(record)}>Edit</button>
                                            )}
                                            <button type="button" className="text-action text-action-danger" disabled={busyId === record._id} onClick={() => handleDelete(record)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default Admissions;
