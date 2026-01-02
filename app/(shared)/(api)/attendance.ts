import axios from "axios";

// 학생 출석 정보
export const getStudentAttendances = async (year: number, date: string) => {
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/attendances/year/${year}/date/${date}`
    );
    return response.data;
};

// 선생님 출석 정보
export const getTeacherAttendances = async (date: string) => {
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/attendance/teachers/status?date=${date}`
    );
    return response.data;
};

// 선생님 출석 체크
export const markTeacherAttendance = async (teacherId: number, status: string, date: string) => {
    const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/attendance/teacher/mark?date=${date}`,
        {
            teacherId: teacherId,
            status: status
        }
    );
    return response.data;
};

// 학생 출석 체크
export const markStudentAttendance = async (studentClassId: number, date: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/attendances/${studentClassId}/${date}`;
    
    console.log("[API] 학생 출석 체크 요청:", {
        url,
        method: "PUT",
        studentClassId,
        date
    });
    
    try {
        const response = await axios.put(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("[API] 학생 출석 체크 성공:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[API] 학생 출석 체크 실패:", {
            url,
            studentClassId,
            date,
            errorStatus: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
};

