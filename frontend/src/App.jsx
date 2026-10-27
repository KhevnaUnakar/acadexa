import { useEffect, useState } from "react";
import Students from "./pages/students";
import Courses from "./pages/courses";
import Fees from "./pages/fees";
import Departments from "./pages/departments";
import Admissions from "./pages/admissions";
import Attendance from "./pages/attendance";
import Examinations from "./pages/examinations";
import { getAllStudents } from "./services/studentService";
import { getAllCourses } from "./services/courseService";
import { getAllFees } from "./services/feeService";
import { getAcademicRecords } from "./services/academicRecordService";
import "./App.css";

const navigation = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    {
        id: "students-group",
        label: "Students",
        icon: "students",
        children: [
            { id: "students", label: "Student Directory" },
            { id: "admissions", label: "Admissions" },
            { id: "examinations", label: "Examinations" }
        ]
    },
    {
        id: "courses-group",
        label: "Courses",
        icon: "courses",
        children: [
            { id: "courses", label: "Course Catalog" },
            { id: "departments", label: "Departments" },
            { id: "attendance", label: "Attendance" }
        ]
    },
    { id: "fees", label: "Fees & Payments", icon: "fees" }
];

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value || 0));

function Icon({ name, size = 20 }) {
    const shared = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
    };

    if (name === "dashboard") {
        return <svg {...shared}><path d="M3 12.75V4.5A1.5 1.5 0 0 1 4.5 3h5.25v9.75H3Zm11.25 0V8.25h5.25A1.5 1.5 0 0 1 21 9.75v3h-6.75ZM3 14.25h9.75V21H4.5A1.5 1.5 0 0 1 3 19.5v-5.25Zm11.25 0H21v5.25A1.5 1.5 0 0 1 19.5 21H14.25v-6.75Z" /></svg>;
    }

    if (name === "students") {
        return <svg {...shared}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    }

    if (name === "courses") {
        return <svg {...shared}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></svg>;
    }

    if (name === "school") {
        return <svg {...shared}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-8h6v8M3 10h18" /></svg>;
    }

    if (name === "departments") {
        return <svg {...shared}><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" /></svg>;
    }

    if (name === "admissions") {
        return <svg {...shared}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></svg>;
    }

    if (name === "fees") {
        return <svg {...shared}><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11Z" /><path d="M3 9.5h18M7 4v5M17 4v5" /></svg>;
    }

    if (name === "attendance") {
        return <svg {...shared}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    }

    if (name === "examinations") {
        return <svg {...shared}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M8 7h8M8 11h8" /></svg>;
    }

    if (name === "student") {
        return <svg {...shared}><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 7v-1a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1" /><path d="M21 8v8M17 12h8" /></svg>;
    }

    return <svg {...shared}><path d="M15 18l-6-6 6-6" /></svg>;
}

function StatCard({ icon, label, value, hint, tone }) {
    return (
        <article className="summary-card">
            <span className={`summary-icon summary-icon-${tone}`} aria-hidden="true">{icon}</span>
            <div>
                <p>{label}</p>
                <strong>{value}</strong>
                {hint ? <small>{hint}</small> : null}
            </div>
        </article>
    );
}

function DashboardPage({ onNavigate }) {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [fees, setFees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const [studentData, courseData, feeData, departmentData, admissionData] = await Promise.all([
                    getAllStudents(),
                    getAllCourses(),
                    getAllFees(),
                    getAcademicRecords("departments"),
                    getAcademicRecords("admissions")
                ]);

                setStudents(studentData.students || []);
                setCourses(courseData.courses || []);
                setFees(feeData.fees || []);
                setDepartments(departmentData.records || []);
                setAdmissions((admissionData.records || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (fetchError) {
                console.error("Error fetching dashboard data:", fetchError);
                setError("Unable to load the academic dashboard. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, []);

    const activeStudents = students.filter((student) => student.enrollmentStatus === "Active").length;
    const totalCollected = fees.reduce((sum, fee) => sum + Number(fee.paidAmount || 0), 0);
    const totalOutstanding = fees.reduce((sum, fee) => sum + Number(fee.balance || 0), 0);
    const recentAdmissions = admissions.slice(0, 4);

    if (loading) {
        return <div className="page-state" role="status"><span className="loading-spinner" />Loading academic dashboard…</div>;
    }

    if (error) {
        return <div className="page-state page-state-error" role="alert">{error}</div>;
    }

    return (
        <div className="page-shell">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Overview</p>
                    <h2>Academic dashboard</h2>
                </div>
                <div className="page-header-actions">
                    <button type="button" className="secondary-button" onClick={() => onNavigate("student-dashboard")}>View student portal</button>
                    <button type="button" className="primary-button" onClick={() => onNavigate("admissions")}>New admission</button>
                </div>
            </header>

            <section className="stats-grid" aria-label="Academic overview metrics">
                <StatCard icon="S" label="Total students" value={students.length} hint={`${activeStudents} active`} tone="indigo" />
                <StatCard icon="C" label="Total courses" value={courses.length} hint={`${courses.filter((course) => course.status === "Active").length} active`} tone="blue" />
                <StatCard icon="D" label="Departments" value={departments.length} hint="Academic units" tone="green" />
                <StatCard icon="₹" label="Fees collected" value={formatCurrency(totalCollected)} hint={`${formatCurrency(totalOutstanding)} outstanding`} tone="amber" />
            </section>

            <div className="dashboard-grid">
                <section className="panel panel-block">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Activity</p>
                            <h3>Recent admissions</h3>
                        </div>
                        <button type="button" className="link-button" onClick={() => onNavigate("admissions")}>View all</button>
                    </div>

                    {recentAdmissions.length === 0 ? (
                        <div className="empty-state">No recent admissions recorded yet.</div>
                    ) : (
                        <ul className="activity-list">
                            {recentAdmissions.map((admission) => (
                                <li key={admission._id} className="activity-item">
                                    <div className="avatar-badge">{(admission.student?.firstName || "S").slice(0, 1)}{(admission.student?.lastName || "").slice(0, 1)}</div>
                                    <div className="activity-copy">
                                        <strong>{admission.student ? `${admission.student.firstName} ${admission.student.lastName}` : "Student record"}</strong>
                                        <span>{admission.course ? `${admission.course.courseCode} · ${admission.course.courseName}` : "Course not assigned"}</span>
                                    </div>
                                    <span className={`status-pill status-${(admission.admissionStatus || "Applied").toLowerCase()}`}>
                                        {admission.admissionStatus || "Applied"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="panel panel-block">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Finance</p>
                            <h3>Fee snapshot</h3>
                        </div>
                        <button type="button" className="link-button" onClick={() => onNavigate("fees")}>Manage</button>
                    </div>

                    <div className="financial-summary">
                        <div>
                            <span>Collection</span>
                            <strong>{formatCurrency(totalCollected)}</strong>
                        </div>
                        <div>
                            <span>Outstanding</span>
                            <strong>{formatCurrency(totalOutstanding)}</strong>
                        </div>
                        <div>
                            <span>Fee records</span>
                            <strong>{fees.length}</strong>
                        </div>
                    </div>
                </section>
            </div>

            <section className="panel panel-block quick-actions-panel">
                <div className="panel-heading">
                    <div>
                        <p className="eyebrow">Actions</p>
                        <h3>Quick actions</h3>
                    </div>
                </div>
                <div className="quick-actions">
                    <button type="button" className="primary-button" onClick={() => onNavigate("students")}>Add student</button>
                    <button type="button" className="secondary-button" onClick={() => onNavigate("courses")}>Add course</button>
                    <button type="button" className="secondary-button" onClick={() => onNavigate("fees")}>Record payment</button>
                    <button type="button" className="secondary-button" onClick={() => onNavigate("attendance")}>Mark attendance</button>
                </div>
            </section>
        </div>
    );
}

function App() {
    const [currentPage, setCurrentPage] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState("");

    const pageDetails = {
        dashboard: { title: "Dashboard", breadcrumb: "Overview" },
        students: { title: "Students", breadcrumb: "Directory" },
        courses: { title: "Courses", breadcrumb: "Academics" },
        fees: { title: "Fees & Payments", breadcrumb: "Finance" },
        departments: { title: "Departments", breadcrumb: "Academic units" },
        admissions: { title: "Admissions", breadcrumb: "Recruitment" },
        attendance: { title: "Attendance", breadcrumb: "Academic tracking" },
        examinations: { title: "Examinations", breadcrumb: "Results" },
        "student-dashboard": { title: "Student Dashboard", breadcrumb: "Student experience" }
    }[currentPage];

    const selectPage = (page) => {
        setCurrentPage(page);
        const group = navigation.find((item) => item.children?.some((child) => child.id === page));
        if (group) {
            setExpandedGroup(group.id);
        }
        setSidebarOpen(false);
    };

    return (
        <div className="dashboard-shell">
            {sidebarOpen && (
                <button
                    className="sidebar-backdrop"
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <aside className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
                <div className="brand">
                    <span className="brand-mark"><Icon name="school" size={21} /></span>
                    <span className="brand-name">Acadexa<span>Student Management</span></span>
                </div>

                <p className="sidebar-section-label">Workspace</p>
                <nav className="side-navigation" aria-label="Main navigation">
                    {navigation.map((item) => {
                        if (!item.children) {
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`nav-link${currentPage === item.id ? " nav-link-active" : ""}`}
                                    aria-current={currentPage === item.id ? "page" : undefined}
                                    onClick={() => selectPage(item.id)}
                                >
                                    <Icon name={item.icon} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        }

                        const isExpanded = expandedGroup === item.id;
                        const hasActiveChild = item.children.some((child) => child.id === currentPage);

                        return (
                            <div className="nav-group" key={item.id}>
                                <button
                                    type="button"
                                    className={`nav-link nav-group-toggle${hasActiveChild ? " nav-link-active" : ""}`}
                                    aria-expanded={isExpanded}
                                    aria-controls={`${item.id}-links`}
                                    onClick={() => setExpandedGroup(isExpanded ? "" : item.id)}
                                >
                                    <Icon name={item.icon} />
                                    <span>{item.label}</span>
                                    <span className={`nav-chevron${isExpanded ? " nav-chevron-open" : ""}`} aria-hidden="true" />
                                </button>
                                {isExpanded && (
                                    <div className="nav-submenu" id={`${item.id}-links`}>
                                        {item.children.map((child) => (
                                            <button
                                                key={child.id}
                                                type="button"
                                                className={`nav-link nav-sublink${currentPage === child.id ? " nav-link-active" : ""}`}
                                                aria-current={currentPage === child.id ? "page" : undefined}
                                                onClick={() => selectPage(child.id)}
                                            >
                                                <span className="nav-submenu-marker" aria-hidden="true" />
                                                <span>{child.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <span className="sidebar-footer-mark"><Icon name="school" size={17} /></span>
                    <span>Academics workspace</span>
                </div>
            </aside>

            <div className="dashboard-main">
                <header className="topbar">
                    <button
                        type="button"
                        className="mobile-menu-button"
                        aria-label="Open navigation"
                        aria-expanded={sidebarOpen}
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span /><span /><span />
                    </button>
                    <div className="topbar-heading">
                        <p className="breadcrumb">{pageDetails.breadcrumb} <span>/</span> {pageDetails.title}</p>
                        <h1>{pageDetails.title}</h1>
                    </div>

                    <div className="topbar-actions">
                        <div className="profile-pill" aria-label="Current user">
                            <span className="avatar-mini">A</span>
                            <div>
                                <strong>Academic Admin</strong>
                                <small>Admin role</small>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="page-content">
                    {currentPage === "dashboard" && <DashboardPage onNavigate={selectPage} />}
                    {currentPage === "students" && <Students />}
                    {currentPage === "courses" && <Courses />}
                    {currentPage === "fees" && <Fees />}
                    {currentPage === "departments" && <Departments />}
                    {currentPage === "admissions" && <Admissions />}
                    {currentPage === "attendance" && <Attendance />}
                    {currentPage === "examinations" && <Examinations />}
                    {/* {currentPage === "student-dashboard" && <StudentDashboard onNavigate={selectPage} />} */}
                </main>
            </div>
        </div>
    );
}

export default App;
