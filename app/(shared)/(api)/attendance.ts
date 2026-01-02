import axios from "axios";

// 학생 출석 정보 (반별 출석 정보)
export const getStudentAttendances = async (schoolYear: number, date: string) => {
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/attendances/classes/year/${schoolYear}/date/${date}`
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

// 특정 선생님의 출석 상태 조회
export const getTeacherAttendanceStatus = async (teacherId: number, date: string) => {
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/attendance/teacher/status?teacherId=${teacherId}&date=${date}`
    );
    return response.data;
};

// 선생님 출석 체크
export const markTeacherAttendance = async (teacherId: number, status: "ATTEND" | "LATE", date: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/attendance/teacher/mark?teacherId=${teacherId}&status=${status}&date=${date}`;
    
    try {
        const response = await axios.post(url, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

// 학생 출석 체크
export const markStudentAttendance = async (studentClassId: number, date: string, status: "ATTEND" | "LATE") => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/attendances/${studentClassId}/${date}`;
    
    try {
        // PUT 요청에 status를 body에 담아서 전송
        const response = await axios.put(url, { status }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

