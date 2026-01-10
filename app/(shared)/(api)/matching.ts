import axios from "axios";

interface AssignStudentRequest {
  studentId: number;
  classRoomId: number;
  schoolYear: number;
}

interface AssignTeacherRequest {
  teacherId: number;
  classRoomId: number;
  schoolYear: number;
}

// 학생 배정
export const assignStudentToClass = async (data: AssignStudentRequest) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/student-classes`,
      {
        studentId: data.studentId,
        classRoomId: data.classRoomId,
        schoolYear: data.schoolYear,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Student Assignment API Error Response:", error.response?.data);
    console.error("Student Assignment API Error Status:", error.response?.status);
    throw error;
  }
};

// 선생님 배정
export const assignTeacherToClass = async (data: AssignTeacherRequest) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/teacher-classes`,
      {
        teacherId: data.teacherId,
        classRoomId: data.classRoomId,
        schoolYear: data.schoolYear,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Teacher Assignment API Error Response:", error.response?.data);
    console.error("Teacher Assignment API Error Status:", error.response?.status);
    throw error;
  }
};
