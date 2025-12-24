import axios from "axios";

export const getStudentsList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`);
    return response.data;
}