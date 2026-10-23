import { useState } from "react";
import Students from "./pages/students";
import Courses from "./pages/courses";
import Fees from "./pages/fees";
import "./App.css";

const navigation = [
    { id: "students", label: "Students", icon: "students" },
    { id: "courses", label: "Courses", icon: "courses" },
    { id: "fees", label: "Fees", icon: "fees" }
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

    return <svg {...shared}><path d="M15 18l-6-6 6-6" /></svg>;
}

function App() {
    const [currentPage, setCurrentPage] = useState("students");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pageDetails = {
        students: { title: "Students" },
        courses: { title: "Courses" },
        fees: { title: "Fees" }
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
                    {currentPage === "students" ? (
                        <Students />
                    ) : currentPage === "courses" ? (
                        <Courses />
                    ) : (
                        <Fees />
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
