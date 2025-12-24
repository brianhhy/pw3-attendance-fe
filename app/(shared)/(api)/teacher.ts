import axios from "axios";

export const getTeacherList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/teacher`);
    return response.data;
}