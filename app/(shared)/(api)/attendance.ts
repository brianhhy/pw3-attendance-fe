import axios from "axios";

// 학생 출석 정보
export const getStudentAttendances = async (year: number, date: string) => {
    const response = await axios.get(
        `https://pw3api.porogramr.site/attendances/year/${year}/date/${date}`
    );
    return response.data;
};

// 선생님 출석 정보
export const getTeacherAttendances = async (date: string) => {
    const response = await axios.get(
        `https://pw3api.porogramr.site/attendance/teachers/status?date=${date}`
    );
    return response.data;
};

// 선생님 출석 체크
export const markTeacherAttendance = async (teacherId: number, status: string, date: string) => {
    const response = await axios.post(
        `https://pw3api.porogramr.site/attendance/teacher/mark?date=${date}`,
        {
            teacherId: teacherId,
            status: status
        }
    );
    return response.data;
};

// 학생 출석 체크
export const markStudentAttendance = async (studentId: number, date: string) => {
    const url = `https://pw3api.porogramr.site/attendances/${studentId}/${date}`;
    
    console.log("[API] 학생 출석 체크 요청:", {
        url,
        method: "PUT",
        studentId,
        date,
        studentIdType: typeof studentId,
        dateType: typeof date
    });
    
    try {
        // PUT 요청에 본문 추가 (일부 서버는 본문을 요구함)
        const response = await axios.put(url, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("[API] 학생 출석 체크 성공:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[API] 학생 출석 체크 실패:", {
            url,
            studentId,
            date,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
};

