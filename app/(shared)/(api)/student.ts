import axios from "axios";

interface NewStudentFormData {
  name: string;
  birth: string;
  sex: string;
  phone: string;
  parentPhone: string;
  school: string;
  memo: string;
}

// 학생 리스트
export const getStudentsList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`);
    return response.data;
}

// 학생 추가
export const addNewStudent = async (formData: NewStudentFormData) => {
  try {
    const payload: any = {};
    
    if (formData.name) payload.name = formData.name;
    if (formData.birth) payload.birth = formData.birth;
    if (formData.sex) payload.sex = formData.sex;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.parentPhone) payload.parentPhone = formData.parentPhone;
    if (formData.school) payload.school = formData.school;
    if (formData.memo) payload.memo = formData.memo;

    console.log("Sending student payload:", payload);

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/students`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Student API Error Response:", error.response?.data);
    console.error("Student API Error Status:", error.response?.status);
    throw error;
  }
};

// 특정 학년도의 반 + 학생들 리스트
export const getStudentClassesBySchoolYear = async (schoolYear?: number, date?: string) => {
    // schoolYear가 제공되지 않으면 올해 년도 사용
    const year = schoolYear || new Date().getFullYear();
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/classes/year/${schoolYear}/date/${date}`
    );
    return response.data;
}

// 학생 수정
export const updateStudent = async (studentId: number, formData: NewStudentFormData) => {
  try {
    const payload: any = {};
    
    if (formData.name) payload.name = formData.name;
    if (formData.birth) payload.birth = formData.birth;
    if (formData.sex) payload.sex = formData.sex;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.parentPhone) payload.parentPhone = formData.parentPhone;
    if (formData.school) payload.school = formData.school;
    if (formData.memo) payload.memo = formData.memo;

    const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Student Update API Error Response:", error.response?.data);
    console.error("Student Update API Error Status:", error.response?.status);
    throw error;
  }
};

// 학생 삭제
export const deleteStudent = async (studentId: number) => {
    const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}`);
    return response.data;
}

// 반별 학생 정보 조회 (학년도별)
export const getStudentClassesByYear = async (schoolYear: number) => {
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/student-classes/school-year/${schoolYear}`
    );
    return response.data;
}

export type StudentRegistrationByYearItem = {
  id: number;
  name: string;
  birth?: string | null;
  phone?: string | null;
  registeredAt?: string | null;
};

// 월별 신규 등록 학생(연도별) 조회
export const getStudentRegistrationsByYear = async (year: number) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/students/registrations/by-year/${year}`
  );
  return response.data;
};