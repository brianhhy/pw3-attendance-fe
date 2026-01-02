import axios from "axios";

// 학생 리스트
export const getStudentsList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`);
    return response.data;
}

// 특정 학년도의 반 + 학생들 리스트
export const getStudentClassesBySchoolYear = async (schoolYear?: number, date?: string) => {
    // schoolYear가 제공되지 않으면 올해 년도 사용
    const year = schoolYear || new Date().getFullYear();
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/classes/year/${schoolYear}/date/${date}`
    );
    return response.data;
}

