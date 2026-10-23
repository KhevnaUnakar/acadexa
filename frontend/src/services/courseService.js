
import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api/courses"
});

// Fetch all courses
export const getAllCourses = async () => {
    const response = await API.get("/");
    return response.data;
};

export const createCourse = async (courseData) => {
    const response = await API.post("/", courseData);
    return response.data;
};

export const updateCourse = async (id, courseData) => {
    const response = await API.put(`/${id}`, courseData);
    return response.data;
};

export const deleteCourse = async (id) => {
    const response = await API.delete(`/${id}`);
    return response.data;
};
