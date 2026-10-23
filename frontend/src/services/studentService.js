
import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api/students"
});

// Fetch all students
export const getAllStudents = async () => {
    const response = await API.get("/");
    return response.data;
};

// Fetch one student using MongoDB _id
export const getStudentById = async (id) => {
    const response = await API.get(`/${id}`);
    return response.data;
};

// Add a new student
export const createStudent = async (studentData) => {
    const response = await API.post("/", studentData);
    return response.data;
};

// Update an existing student
export const updateStudent = async (id, studentData) => {
    const response = await API.put(`/${id}`, studentData);
    return response.data;
};

// Delete a student
export const deleteStudent = async (id) => {
    const response = await API.delete(`/${id}`);
    return response.data;
};

export default API;
