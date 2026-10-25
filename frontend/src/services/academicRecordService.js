import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api"
});

export const getAcademicRecords = async (resource) => {
    const response = await API.get(`/${resource}`);
    return response.data;
};

export const createAcademicRecord = async (resource, data) => {
    const response = await API.post(`/${resource}`, data);
    return response.data;
};

export const updateAcademicRecord = async (resource, id, data) => {
    const response = await API.put(`/${resource}/${id}`, data);
    return response.data;
};

export const deleteAcademicRecord = async (resource, id) => {
    const response = await API.delete(`/${resource}/${id}`);
    return response.data;
};
