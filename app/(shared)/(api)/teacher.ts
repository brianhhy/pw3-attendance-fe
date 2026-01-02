import axios from "axios";


// 선생님 리스트
export const getTeacherList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/teacher`);
    return response.data;
}