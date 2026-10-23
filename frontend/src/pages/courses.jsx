import { useEffect, useState } from "react";
import { getAllCourses, createCourse, updateCourse, deleteCourse } from "../services/courseService";
import "./courses.css";

const emptyCourse = {
    courseCode: "",
    courseName: "",
    duration: 2,
    description: "",
    status: "Active",
    fee:0
};

function Courses() {
    const [showForm, setShowForm] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [formData, setFormData] = useState(emptyCourse);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const totalCourses = courses.length;
    const activeCourses = courses.filter((course) => course.status === "Active").length;
    const inactiveCourses = courses.filter((course) => course.status === "Inactive").length;

    const refreshCourses = async () => {
        const data = await getAllCourses();
        setCourses(data.courses);
    };

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                await refreshCourses();
            } catch (err) {
                console.error("Error fetching courses:", err);
                setError("Unable to fetch courses. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter((course) => {
        const query = searchTerm.trim().toLowerCase();
        return [course.courseCode, course.courseName, course.description]
            .some((value) => (value || "").toLowerCase().includes(query));
    });

    const openCreateForm = () => {
        setFormData(emptyCourse);
        setEditingCourseId(null);
        setFormError("");
        setShowForm(true);
    };

    const handleDeleteCourse = async (course) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${course.courseName}"?`);
        if (!confirmed) return;

        try {
            await deleteCourse(course._id);
            await refreshCourses();
        } catch (err) {
            console.error("Error deleting course:", err.response?.data || err.message);
            window.alert(err.response?.data?.message || "Unable to delete course. Please try again.");
        }
    };

    const handleEditCourse = (course) => {
        setFormData({
            courseCode: course.courseCode,
            courseName: course.courseName,
            duration: course.duration,
            description: course.description || "",
            status: course.status,
            fee: course.fee ?? 0
        });

        setEditingCourseId(course._id);
        setFormError("");
        setShowForm(true);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((previousData) => ({ ...previousData, [name]: value }));
    };

    const handleSaveCourse = async (event) => {
        event.preventDefault();
        setFormError("");
        setSaving(true);    
        const courseData = {
            ...formData,
            courseCode: formData.courseCode.trim().toUpperCase(),
            courseName: formData.courseName.trim(),
            duration: Number(formData.duration),
            fee: Number(formData.fee),
            description: formData.description.trim()
        };
        try {
            if (editingCourseId) {
                await updateCourse(editingCourseId, courseData);
            } else {
                await createCourse(courseData);
            }
            await refreshCourses();
            setFormData(emptyCourse);
            setEditingCourseId(null);
            setShowForm(false);
        } catch (err) {
            console.error("Error saving course:", err.response?.data || err.message);
            if (err.response?.status === 409) {
                setFormError("This course code already exists.");
            } else if (err.response?.status === 400) {
                setFormError(err.response?.data?.message || "Please check the course details and try again.");
            } else {
                setFormError(err.response?.data?.message || "Unable to save course. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="page-state" role="status"><span className="loading-spinner" />Loading courses…</div>;
    }
    if (error) {
        return <div className="page-state page-state-error" role="alert">{error}</div>;
    }

    return (
        <div className="courses-page">
            <section className="page-intro">
                <div>
                    <h2>Course Management</h2>
                    <p>Organize your academic offerings and keep course details up to date.</p>
                </div>
                <button type="button" className="primary-button" onClick={openCreateForm}><span aria-hidden="true">+</span> Add course</button>
            </section>

            <section className="course-stats" aria-label="Course overview">
                <article className="summary-card">
                    <span className="summary-icon summary-icon-indigo" aria-hidden="true">C</span>
                    <div><p>Total courses</p><strong>{totalCourses}</strong></div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-green" aria-hidden="true">A</span>
                    <div><p>Active courses</p><strong>{activeCourses}</strong></div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon summary-icon-amber" aria-hidden="true">I</span>
                    <div><p>Inactive courses</p><strong>{inactiveCourses}</strong></div>
                </article>
            </section>

            {showForm && (
                <section className="panel course-form-panel" aria-labelledby="course-form-title">
                    <div className="form-panel-heading">
                        <div>
                            <h3 id="course-form-title">{editingCourseId ? "Edit course" : "Add a course"}</h3>
                            <p>Enter the course details below.</p>
                        </div>
                    </div>
                    <form onSubmit={handleSaveCourse}>
                        <div className="course-form-grid">
                            <div className="form-field">
                                <label htmlFor="courseCode">Course code <span>*</span></label>
                                <input id="courseCode" name="courseCode" type="text" placeholder="e.g. MCA" value={formData.courseCode} onChange={handleInputChange} required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="courseName">Course name <span>*</span></label>
                                <input id="courseName" name="courseName" type="text" placeholder="Enter course name" value={formData.courseName} onChange={handleInputChange} required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="duration">Duration (years) <span>*</span></label>
                                <input id="duration" name="duration" type="number" min="1" max="10" value={formData.duration} onChange={handleInputChange} required />
                            </div>                                                        
                            <div className="form-field">
                                <label htmlFor="fee">Standard fee (₹) <span>*</span></label>
                                <input id="fee" name="fee" type="number" min="0" step="0.01" placeholder="Enter course fee"
                                    value={formData.fee} onChange={handleInputChange} required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="courseStatus">Status</label>
                                <select id="courseStatus" name="status" value={formData.status} onChange={handleInputChange}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="form-field course-description-field">
                                <label htmlFor="description">Description</label>
                                <textarea id="description" name="description" placeholder="Describe this course" value={formData.description} onChange={handleInputChange} rows="3" />
                            </div>
                        </div>
                        {formError && <p className="form-error" role="alert">{formError}</p>}
                        <div className="form-actions">
                            <button type="button" className="secondary-button" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : editingCourseId ? "Update course" : "Save course"}</button>
                        </div>
                    </form>
                </section>
            )}

            <section className="panel course-table-panel">
                <div className="table-toolbar">
                    <div><h3>All courses</h3><p>{filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}</p></div>
                    <label className="course-search">
                        <span className="search-symbol" aria-hidden="true" />
                        <span className="visually-hidden">Search courses</span>
                        <input type="search" placeholder="Search courses…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                    </label>
                </div>
                <div className="table-scroll">
                    <table className="data-table course-table">
                        <thead><tr><th>Course</th><th>Course name</th><th>Duration</th><th>Description</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                        <tbody>
                            {filteredCourses.length === 0 ? (
                                <tr><td colSpan="7"><div className="table-empty"><span className="empty-icon" aria-hidden="true">⌕</span><strong>{courses.length ? "No matching courses" : "No courses yet"}</strong><p>{courses.length ? "Try a different search term." : "Add a course to build your academic catalog."}</p></div></td></tr>
                            ) : filteredCourses.map((course) => (
                                <tr key={course._id}>
                                    <td><span className="course-code">{course.courseCode}</span></td>
                                    <td><span className="course-name">{course.courseName}</span></td>
                                    <td>{course.duration} {course.duration === 1 ? "year" : "years"}</td>
                                    <td>₹{Number(course.fee ?? 0).toLocaleString("en-IN", 
                                            {style: "currency",
                                            currency: "INR",
                                            maximumFractionDigits: 2})}
                                    </td>
                                    <td className="course-description">{course.description || "—"}</td>
                                    <td><span className={`course-status ${course.status === "Active" ? "status-active" : "status-inactive"}`}>{course.status}</span></td>
                                    <td><div className="row-actions">
                                        <button type="button" className="text-action" onClick={() => handleEditCourse(course)} aria-label={`Edit ${course.courseName}`}>Edit</button>
                                        <button type="button" className="text-action text-action-danger" onClick={() => handleDeleteCourse(course)} aria-label={`Delete ${course.courseName}`}>Delete</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default Courses;
