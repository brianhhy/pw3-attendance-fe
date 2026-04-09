import axios from "axios";

interface NewTeacherFormData {
  name: string;
  birth: string;
  sex: string;
  phone: string;
  teacherType: string;
  memo: string;
}

// 전체 선생님 목록을 조회한다.
export const getTeacherList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/teacher`);
    return response.data;
}

// 새 선생님을 추가한다. teacherType은 대문자로 변환하여 전송하며, 서버 에러 메시지를 포함한 에러를 throw한다.
export const addNewTeacher = async (formData: NewTeacherFormData) => {
  try {
    const payload: any = {};

    payload.name = formData.name;
    payload.sex = formData.sex;

    if (formData.birth) payload.birth = formData.birth;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.memo) payload.memo = formData.memo;

    if (formData.teacherType && formData.teacherType.trim() !== "") {
      const typeMap: { [key: string]: string } = {
        "teacher": "TEACHER",
        "helper": "HELPER",
        "pastor": "PASTOR"
      };
      const upperType = typeMap[formData.teacherType.toLowerCase()] || formData.teacherType.toUpperCase();
      payload.teacherType = upperType;
    }

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/teacher`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data;
    const enhancedError = new Error(
      errorData?.message ||
      errorData?.error ||
      error.message ||
      "선생님 추가에 실패했습니다."
    );
    (enhancedError as any).response = error.response;
    throw enhancedError;
  }
};

// 특정 선생님의 정보를 수정한다. teacherType은 대문자로 변환하여 전송하며, 서버 에러 메시지를 포함한 에러를 throw한다.
export const updateTeacher = async (teacherId: number, formData: NewTeacherFormData) => {
  try {
    const payload: any = {};

    payload.name = formData.name;
    payload.sex = formData.sex;

    if (formData.birth) payload.birth = formData.birth;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.memo) payload.memo = formData.memo;

    if (formData.teacherType && formData.teacherType.trim() !== "") {
      const typeMap: { [key: string]: string } = {
        "teacher": "TEACHER",
        "helper": "HELPER",
        "pastor": "PASTOR"
      };
      const upperType = typeMap[formData.teacherType.toLowerCase()] || formData.teacherType.toUpperCase();
      payload.teacherType = upperType;
    }

    const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/teacher/${teacherId}`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data;
    const enhancedError = new Error(
      errorData?.message ||
      errorData?.error ||
      error.message ||
      "선생님 수정에 실패했습니다."
    );
    (enhancedError as any).response = error.response;
    throw enhancedError;
  }
};

// 특정 선생님을 삭제한다.
export const deleteTeacher = async (teacherId: number) => {
    const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/teacher/${teacherId}`);
    return response.data;
}
