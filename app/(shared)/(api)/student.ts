import axios from "axios";

// 학생 리스트
export const getStudentsList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`);
    return response.data;
}

