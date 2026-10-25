import AcademicRecords from "./AcademicRecords";

const config = {
    resource: "examinations",
    title: "Examinations",
    singular: "Examination",
    description: "Record student marks and examination results.",
    fields: [
        { name: "student", label: "Student", type: "select", options: "students" },
        { name: "subject", label: "Subject or exam name", type: "text" },
        { name: "totalMarks", label: "Total marks", type: "number", min: "1", step: "0.01" },
        { name: "marksObtained", label: "Marks obtained", type: "number", min: "0", max: "totalMarks", step: "0.01" },
        { name: "result", label: "Result", type: "select", choices: ["Pass", "Fail", "Pending"], defaultValue: "Pending" }
    ],
    columns: [
        { name: "student", label: "Student", relation: "student" },
        { name: "subject", label: "Subject / Exam" },
        { name: "totalMarks", label: "Total marks" },
        { name: "marksObtained", label: "Marks obtained" },
        { name: "result", label: "Result" }
    ]
};

export default function Examinations() {
    return <AcademicRecords config={config} />;
}
