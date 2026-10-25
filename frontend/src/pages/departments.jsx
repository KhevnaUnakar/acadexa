import AcademicRecords from "./AcademicRecords";

const config = {
    resource: "departments",
    title: "Departments",
    singular: "Department",
    description: "Create and maintain academic departments.",
    fields: [
        { name: "departmentName", label: "Department name", type: "text" },
        { name: "departmentCode", label: "Department code", type: "text" },
        { name: "description", label: "Description", type: "textarea", required: false }
    ],
    columns: [
        { name: "departmentName", label: "Department" },
        { name: "departmentCode", label: "Code" },
        { name: "description", label: "Description" }
    ]
};

export default function Departments() {
    return <AcademicRecords config={config} />;
}
