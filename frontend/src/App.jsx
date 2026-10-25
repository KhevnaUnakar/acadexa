import { useState } from "react";
import Students from "./pages/students";
import Courses from "./pages/courses";
import Fees from "./pages/fees";
import Departments from "./pages/departments";
import Admissions from "./pages/admissions";
import Attendance from "./pages/attendance";
import Examinations from "./pages/examinations";
import "./App.css";

const navigation = [
    { id: "students", label: "Students", icon: "students" },
    { id: "courses", label: "Courses", icon: "courses" },
    { id: "fees", label: "Fees", icon: "fees" },
    { id: "departments", label: "Departments", icon: "departments" },
    { id: "admissions", label: "Admissions", icon: "admissions" },
    { id: "attendance", label: "Attendance", icon: "attendance" },
    { id: "examinations", label: "Examinations", icon: "examinations" }
];

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

    if (name === "attendance") {
        return <svg {...shared}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    }

    if (name === "examinations") {
        return <svg {...shared}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M8 7h8M8 11h8" /></svg>;
    }

    return <svg {...shared}><path d="M15 18l-6-6 6-6" /></svg>;
}

function App() {
    const [currentPage, setCurrentPage] = useState("students");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pageDetails = {
        students: { title: "Students" },
        courses: { title: "Courses" },
        fees: { title: "Fees" },
        departments: { title: "Departments" },
        admissions: { title: "Admissions" },
        attendance: { title: "Attendance" },
        examinations: { title: "Examinations" }
    }[currentPage];

    const selectPage = (page) => {
        setCurrentPage(page);
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
                    <span className="brand-name">Student Management<span>Administration</span></span>
                </div>

                <p className="sidebar-section-label">Workspace</p>
                <nav className="side-navigation" aria-label="Main navigation">
                    {navigation.map((item) => (
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
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <span className="sidebar-footer-mark"><Icon name="school" size={17} /></span>
                    <span>Education workspace</span>
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
                        <p className="breadcrumb">Workspace <span>/</span> {pageDetails.title}</p>
                        <h1>{pageDetails.title}</h1>
                    </div>
                </header>               
                <main className="page-content">
                    {currentPage === "students" && <Students />}
                    {currentPage === "courses" && <Courses />}
                    {currentPage === "fees" && <Fees />}
                    {currentPage === "departments" && <Departments />}
                    {currentPage === "admissions" && <Admissions />}
                    {currentPage === "attendance" && <Attendance />}
                    {currentPage === "examinations" && <Examinations />}
                </main>
            </div>
        </div>
    );
}

export default App;
