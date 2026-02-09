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



// 선생님 출석 체크
export const markTeacherAttendance = async (teacherId: number, status: "ATTEND" | "LATE" | "ABSENT" | "OTHER", date: string) => {
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
export const markStudentAttendance = async (studentClassId: number, date: string, status: "ATTEND" | "LATE" | "ABSENT" | "OTHER") => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/attendances/${studentClassId}/${date}`;
    
    try {
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

// 출석부 내보내기
export const exportAttendanceSummary = async (date: string, schoolYear: number) => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/attendances/summary-by-date`,
            {
                params: {
                    date: date,
                    schoolYear: schoolYear,
                },
            }
        );
        return response.data;
    } catch (error: any) {
        console.error("Attendance Export API Error Response:", error.response?.data);
        console.error("Attendance Export API Error Status:", error.response?.status);
        throw error;
    }
};

// 학년별 일요일 출석 통계
export const getGradeSundayStats = async () => {
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/attendances/summary/grades/sundays`
    );
    return response.data;
};