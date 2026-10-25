import { useEffect, useState } from "react";
import { getAllStudents } from "../services/studentService";
import { getAllCourses } from "../services/courseService";
import {
    createAcademicRecord,
    deleteAcademicRecord,
    getAcademicRecords,
    updateAcademicRecord
} from "../services/academicRecordService";
import "./academicRecords.css";

const getInitialData = (fields) => Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ""]));

const getValue = (record, field) => {
    const value = record[field.name];
    if (field.type === "select" && value && typeof value === "object") {
        return value._id;
    }
    if (field.type === "date" && value) {
        return new Date(value).toISOString().slice(0, 10);
    }
    return value ?? "";
};

const displayValue = (record, column) => {
    const value = record[column.name];
    if (column.relation) {
        return value
            ? column.relation === "student"
                ? `${value.studentId} - ${value.firstName} ${value.lastName}`
                : `${value.courseCode} - ${value.courseName}`
            : "N/A";
    }
    if (column.type === "date" && value) {
        return new Date(value).toLocaleDateString();
    }
    return value ?? "—";
};

function AcademicRecords({ config }) {
    const [records, setRecords] = useState([]);
    const [options, setOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState("");
    const [formData, setFormData] = useState(() => getInitialData(config.fields));
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    const refreshRecords = async () => {
        const data = await getAcademicRecords(config.resource);
        setRecords(data.records);
    };

    useEffect(() => {
        const loadPage = async () => {
            try {
                const requests = [getAcademicRecords(config.resource)];
                if (config.fields.some((field) => field.options === "students")) {
                    requests.push(getAllStudents());
                }
                if (config.fields.some((field) => field.options === "courses")) {
                    requests.push(getAllCourses());
                }
                const responses = await Promise.all(requests);
                setRecords(responses[0].records);
                let responseIndex = 1;
                const loadedOptions = {};
                if (config.fields.some((field) => field.options === "students")) {
                    loadedOptions.students = responses[responseIndex++].students;
                }
                if (config.fields.some((field) => field.options === "courses")) {
                    loadedOptions.courses = responses[responseIndex].courses;
                }
                setOptions(loadedOptions);
            } catch (error) {
                console.error(`Error loading ${config.title.toLowerCase()}:`, error);
                setLoadError(error.response?.data?.message || `Unable to load ${config.title.toLowerCase()}. Please try again.`);
            } finally {
                setLoading(false);
            }
        };
        loadPage();
    }, [config]);

    const openCreateForm = () => {
        setEditingId("");
        setFormData(getInitialData(config.fields));
        setFormError("");
        setFormOpen(true);
    };

    const openEditForm = (record) => {
        setEditingId(record._id);
        setFormData(Object.fromEntries(config.fields.map((field) => [field.name, getValue(record, field)])));
        setFormError("");
        setFormOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");
        setSaving(true);
        const data = Object.fromEntries(config.fields.map((field) => {
            const value = formData[field.name];
            return [field.name, field.type === "number" ? Number(value) : value];
        }));
        try {
            if (editingId) {
                await updateAcademicRecord(config.resource, editingId, data);
            } else {
                await createAcademicRecord(config.resource, data);
            }
            await refreshRecords();
            setFormOpen(false);
        } catch (error) {
            console.error(`Error saving ${config.title.toLowerCase()}:`, error.response?.data || error.message);
            setFormError(error.response?.data?.message || `Unable to save ${config.title.toLowerCase()}. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Delete this ${config.singular.toLowerCase()} record?`)) return;
        try {
            await deleteAcademicRecord(config.resource, record._id);
            await refreshRecords();
        } catch (error) {
            console.error(`Error deleting ${config.title.toLowerCase()}:`, error.response?.data || error.message);
            window.alert(error.response?.data?.message || `Unable to delete ${config.singular.toLowerCase()}. Please try again.`);
        }
    };

    if (loading) {
        return <div className="page-state" role="status"><span className="loading-spinner" />Loading {config.title.toLowerCase()}…</div>;
    }
    if (loadError) {
        return <div className="page-state page-state-error" role="alert">{loadError}</div>;
    }

    return (
        <div className="academic-records-page">
            <section className="page-intro">
                <div>
                    <h2>{config.title}</h2>
                    <p>{config.description}</p>
                </div>
                <button type="button" className="primary-button" onClick={openCreateForm}>
                    <span aria-hidden="true">+</span> Add {config.singular.toLowerCase()}
                </button>
            </section>

            {formOpen && (
                <section className="panel academic-form-panel" aria-labelledby="academic-form-title">
                    <div className="form-panel-heading">
                        <h3 id="academic-form-title">{editingId ? `Edit ${config.singular.toLowerCase()}` : `Add ${config.singular.toLowerCase()}`}</h3>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="academic-form-grid">
                            {config.fields.map((field) => (
                                <div className="form-field" key={field.name}>
                                    <label htmlFor={`${config.resource}-${field.name}`}>{field.label} <span>*</span></label>
                                    {field.type === "select" ? (
                                        <select
                                            id={`${config.resource}-${field.name}`}
                                            value={formData[field.name]}
                                            required
                                            onChange={(event) => setFormData({ ...formData, [field.name]: event.target.value })}
                                        >
                                            <option value="">Select {field.label.toLowerCase()}</option>
                                            {(field.options ? options[field.options] || [] : field.choices).map((option) => (
                                                <option key={option._id || option} value={option._id || option}>
                                                    {field.options === "students"
                                                        ? `${option.studentId} - ${option.firstName} ${option.lastName}`
                                                        : field.options === "courses"
                                                            ? `${option.courseCode} - ${option.courseName}`
                                                            : option}
                                                </option>
                                            ))}
                                        </select>
                                    ) : field.type === "textarea" ? (
                                        <textarea
                                            id={`${config.resource}-${field.name}`}
                                            value={formData[field.name]}
                                            required={field.required !== false}
                                            onChange={(event) => setFormData({ ...formData, [field.name]: event.target.value })}
                                        />
                                    ) : (
                                        <input
                                            id={`${config.resource}-${field.name}`}
                                            type={field.type}
                                            min={field.min}
                                            max={field.max === "totalMarks" ? formData.totalMarks : field.max}
                                            step={field.step}
                                            value={formData[field.name]}
                                            required
                                            onChange={(event) => setFormData({ ...formData, [field.name]: event.target.value })}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        {formError && <p className="form-error" role="alert">{formError}</p>}
                        <div className="form-actions">
                            <button type="button" className="secondary-button" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
                            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save record"}</button>
                        </div>
                    </form>
                </section>
            )}

            <section className="panel academic-table-panel">
                <div className="table-toolbar">
                    <div>
                        <h3>{config.title} records</h3>
                        <p>{records.length} {config.singular.toLowerCase()}{records.length === 1 ? "" : "s"}</p>
                    </div>
                </div>
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {config.columns.map((column) => <th key={column.name}>{column.label}</th>)}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr><td colSpan={config.columns.length + 1} className="academic-empty">No {config.title.toLowerCase()} records found.</td></tr>
                            ) : records.map((record) => (
                                <tr key={record._id}>
                                    {config.columns.map((column) => <td key={column.name}>{displayValue(record, column)}</td>)}
                                    <td>
                                        <div className="row-actions">
                                            <button type="button" className="text-action" onClick={() => openEditForm(record)}>Edit</button>
                                            <button type="button" className="text-action text-action-danger" onClick={() => handleDelete(record)}>Delete</button>
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

export default AcademicRecords;
