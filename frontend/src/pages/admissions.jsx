import AcademicRecords from "./AcademicRecords";

const config = {
    resource: "admissions",
    title: "Admissions",
    singular: "Admission",
    description: "Record and manage student course admissions.",
    fields: [
        { name: "student", label: "Student", type: "select", options: "students" },
        { name: "course", label: "Course", type: "select", options: "courses" },
        { name: "admissionDate", label: "Admission date", type: "date" },
        { name: "admissionStatus", label: "Status", type: "select", choices: ["Applied", "Approved", "Rejected"], defaultValue: "Applied" }
    ],
    columns: [
        { name: "student", label: "Student", relation: "student" },
        { name: "course", label: "Course", relation: "course" },
        { name: "admissionDate", label: "Admission date", type: "date" },
        { name: "admissionStatus", label: "Status" }
    ]
};

export default function Admissions() {
    return <AcademicRecords config={config} />;
}
