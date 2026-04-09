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

// 전체 학생 목록을 조회한다.
export const getStudentsList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`);
    return response.data;
}

// 새 학생을 추가한다. 입력된 폼 데이터에서 값이 있는 필드만 payload에 포함하여 전송한다.
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

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/students`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 특정 학년도와 날짜 기준으로 반 및 학생 목록을 조회한다.
export const getStudentClassesBySchoolYear = async (schoolYear?: number, date?: string) => {
    const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/classes/year/${schoolYear}/date/${date}`
    );
    return response.data;
}

// 특정 학생의 정보를 수정한다. 값이 있는 필드만 payload에 포함하여 전송한다.
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
    throw error;
  }
};

// 특정 학생을 삭제한다.
export const deleteStudent = async (studentId: number) => {
    const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}`);
    return response.data;
}

export interface StudentClassStudentItem {
  id: number;
  studentId: number;
  studentName: string;
}

export interface StudentClassItem {
  classRoomId: number;
  schoolType: string;
  grade: number;
  classNumber: number;
  className?: string;
  teacherName?: string;
  students?: StudentClassStudentItem[];
}

// 학년도별 반 목록과 각 반의 학생 정보를 조회한다.
export const getStudentClassesByYear = async (schoolYear: number): Promise<StudentClassItem[]> => {
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

// 특정 연도의 월별 신규 등록 학생 목록을 조회한다.
export const getStudentRegistrationsByYear = async (year: number) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/students/registrations/by-year/${year}`
  );
  return response.data;
};
