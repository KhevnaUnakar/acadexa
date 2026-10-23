import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api/fees"
});

export const getAllFees = async () => {
    const response = await API.get("/");
    return response.data;
};

export const createFee = async (feeData) => {
    const response = await API.post("/", feeData);
    return response.data;
};
