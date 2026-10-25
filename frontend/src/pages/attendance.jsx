import AcademicRecords from "./AcademicRecords";

const config = {
    resource: "attendance",
    title: "Attendance",
    singular: "Attendance",
    description: "Mark and review student attendance by date.",
    fields: [
        { name: "student", label: "Student", type: "select", options: "students" },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Attendance status", type: "select", choices: ["Present", "Absent"] }
    ],
    columns: [
        { name: "student", label: "Student", relation: "student" },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status" }
    ]
};

export default function Attendance() {
    return <AcademicRecords config={config} />;
}
