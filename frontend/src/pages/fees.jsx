import { useEffect, useState } from "react";
import { getAllStudents } from "../services/studentService";
import { getAllCourses } from "../services/courseService";
import { getAllFees, createFee, addPayment } from "../services/feeService";
import "./fees.css";

function Fees() {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [feeOverride, setFeeOverride] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [paymentFee, setPaymentFee] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [paymentMessage, setPaymentMessage] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [savingPayment, setSavingPayment] = useState(false);

    const refreshFees = async () => {
        const data = await getAllFees();
        setFees(data.fees);
    };

    useEffect(() => {
        const fetchFees = async () => {
            try {
                const [feeData, studentData, courseData] = await Promise.all([
                    getAllFees(),
                    getAllStudents(),
                    getAllCourses()
                ]);

                setFees(feeData.fees);
                setStudents(studentData.students);
                setCourses(courseData.courses);
            } catch (err) {
                console.error("Error fetching fees:", err);
                setError("Unable to fetch fee records. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchFees();
    }, []);

    const handleCreateFee = async (e) => {
        e.preventDefault();
        setFormMessage("");

        try {
            const feeData = {
                student: selectedStudent,
                course: selectedCourse
            };

            if (feeOverride !== "") {
                feeData.totalFee = Number(feeOverride);
            }

            await createFee(feeData);

            setFormMessage("Fee record created successfully!");
            setSelectedStudent("");
            setSelectedCourse("");
            setFeeOverride("");

            await refreshFees();
        } catch (err) {
            console.error("Error creating fee record:", err);
            setFormMessage(
                err.response?.data?.message || "Unable to create fee record."
            );
        }
    };

    const openPaymentForm = (fee) => {
        setPaymentFee(fee);
        setPaymentAmount("");
        setPaymentMethod("Cash");
        setPaymentMessage("");
        setPaymentError("");
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setPaymentMessage("");
        setPaymentError("");

        const amount = Number(paymentAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            setPaymentError("Enter a payment amount greater than zero.");
            return;
        }
        if (amount > paymentFee.balance) {
            setPaymentError("Payment cannot exceed the outstanding balance.");
            return;
        }

        setSavingPayment(true);
        try {
            await addPayment(paymentFee._id, { amount, paymentMethod });
            setPaymentFee(null);
            setPaymentAmount("");
            setPaymentMessage("Payment recorded successfully.");
            try {
                await refreshFees();
            } catch (err) {
                console.error("Payment recorded but fee records could not be refreshed:", err);
                setPaymentMessage(
                    "Payment recorded successfully, but fee records could not be refreshed. Please reload the page."
                );
            }
        } catch (err) {
            console.error("Error recording payment:", err.response?.data || err.message);
            setPaymentError(
                err.response?.data?.message || "Unable to record payment. Please try again."
            );
        } finally {
            setSavingPayment(false);
        }
    };

    return (
        <div className="fees-page">
            <h1>Fee Management</h1>
            <p>Manage student fees, payments, and outstanding balances.</p>

            <div className="fee-form-container">
            <h2>Create Fee Record</h2>

            <form onSubmit={handleCreateFee} className="fee-form">
                <label>
                    Student
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        required
                    >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                            <option key={student._id} value={student._id}>
                                {student.studentId} - {student.firstName} {student.lastName}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Course
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        required
                    >
                        <option value="">Select Course</option>
                        {courses.map((course) => (
                            <option key={course._id} value={course._id}>
                                {course.courseCode} - {course.courseName} (₹
                                {Number(course.fee || 0).toLocaleString("en-IN")})
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Fee Override (Optional)
                    <input
                        type="number"
                        min="0"
                        value={feeOverride}
                        onChange={(e) => setFeeOverride(e.target.value)}
                        placeholder="Leave blank to use course fee"
                    />
                </label>

                <button type="submit">Create Fee Record</button>
            </form>

            {formMessage && <p className="form-message">{formMessage}</p>}
        </div>
            
            {loading && <p>Loading fee records...</p>}

            {!loading && error && (
                <p className="error-message">{error}</p>
            )}
            {paymentMessage && <p className="form-message success-message" role="status">{paymentMessage}</p>}

            {paymentFee && (
                <section className="fee-payment-panel" aria-labelledby="payment-form-title">
                    <div className="fee-payment-heading">
                        <div>
                            <h2 id="payment-form-title">Record Payment</h2>
                            <p>
                                {paymentFee.student?.firstName} {paymentFee.student?.lastName}
                                {" · "}Outstanding: ₹{Number(paymentFee.balance).toLocaleString("en-IN")}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="fee-cancel-button"
                            onClick={() => setPaymentFee(null)}
                            disabled={savingPayment}
                        >
                            Cancel
                        </button>
                    </div>
                    <form className="fee-form" onSubmit={handleRecordPayment}>
                        <label>
                            Installment Amount (₹)
                            <input
                                type="number"
                                min="0.01"
                                max={paymentFee.balance}
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Payment Method
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                required
                            >
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>
                        <button type="submit" disabled={savingPayment}>
                            {savingPayment ? "Saving..." : "Save Payment"}
                        </button>
                    </form>
                    {paymentError && <p className="error-message" role="alert">{paymentError}</p>}
                </section>
            )}
               
            {!loading && !error && (
                <>
                    <p>Total fee records: {fees.length}</p>

                    <div className="fees-table-container">
                        <table className="fees-table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Student Name</th>
                                    <th>Course</th>
                                    <th>Total Fee</th>
                                    <th>Paid Amount</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {fees.length === 0 ? (
                                    <tr>
                                        <td colSpan="8">
                                            No fee records found.
                                        </td>
                                    </tr>
                                ) : (
                                    fees.map((fee) => (
                                        <tr key={fee._id}>
                                            <td>
                                                {fee.student?.studentId || "N/A"}
                                            </td>
                                            <td>
                                                {fee.student
                                                    ? `${fee.student.firstName} ${fee.student.lastName}`
                                                    : "N/A"}
                                            </td>
                                            <td>
                                                {fee.course?.courseName || "N/A"}
                                            </td>
                                            <td>₹{Number(fee.totalFee).toLocaleString("en-IN")}</td>
                                            <td>₹{Number(fee.paidAmount).toLocaleString("en-IN")}</td>
                                            <td>₹{Number(fee.balance).toLocaleString("en-IN")}</td>
                                            <td>
                                                <span className={`fee-status ${fee.paymentStatus?.toLowerCase()}`}>
                                                    {fee.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                {fee.balance > 0 ? (
                                                    <button
                                                        type="button"
                                                        className="record-payment-button"
                                                        onClick={() => openPaymentForm(fee)}
                                                    >
                                                        Record payment
                                                    </button>
                                                ) : (
                                                    <span className="payment-complete">Paid in full</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default Fees;
