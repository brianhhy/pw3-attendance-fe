import axios from "axios";

interface NewTeacherFormData {
  name: string;
  birth: string;
  sex: string;
  phone: string;
  teacherType: string;
  memo: string;
}

// 선생님 리스트
export const getTeacherList = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/teacher`);
    return response.data;
}

// 선생님 추가
export const addNewTeacher = async (formData: NewTeacherFormData) => {
  try {
    const payload: any = {};
    
    // 필수 필드
    payload.name = formData.name;
    payload.sex = formData.sex;
    
    // 선택 필드
    if (formData.birth) payload.birth = formData.birth;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.memo) payload.memo = formData.memo;
    
    // teacherType 처리 - teacherType 필드로 전송하고 대문자로 변환
    if (formData.teacherType && formData.teacherType.trim() !== "") {
      // 값 매핑: teacher -> TEACHER, helper -> HELPER, pastor -> PASTOR
      const typeMap: { [key: string]: string } = {
        "teacher": "TEACHER",
        "helper": "HELPER",
        "pastor": "PASTOR"
      };
      const upperType = typeMap[formData.teacherType.toLowerCase()] || formData.teacherType.toUpperCase();
      payload.teacherType = upperType;
    }

    console.log("Sending teacher payload:", JSON.stringify(payload, null, 2));
    console.log("Request URL:", `${process.env.NEXT_PUBLIC_API_URL}/teacher`);

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/teacher`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("=== Teacher API Error ===");
    console.error("Status:", error.response?.status);
    console.error("Error Data:", errorData);
    console.error("Error Message:", errorData?.message || errorData?.error || error.message);
    console.error("Full Error Response:", JSON.stringify(error.response, null, 2));
    console.error("========================");
    
    // 에러 메시지를 더 자세히 전달
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

// 선생님 수정
export const updateTeacher = async (teacherId: number, formData: NewTeacherFormData) => {
  try {
    const payload: any = {};
    
    // 필수 필드
    payload.name = formData.name;
    payload.sex = formData.sex;
    
    // 선택 필드
    if (formData.birth) payload.birth = formData.birth;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.memo) payload.memo = formData.memo;
    
    // teacherType 처리 - teacherType 필드로 전송하고 대문자로 변환
    if (formData.teacherType && formData.teacherType.trim() !== "") {
      // 값 매핑: teacher -> TEACHER, helper -> HELPER, pastor -> PASTOR
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
    console.error("=== Teacher Update API Error ===");
    console.error("Status:", error.response?.status);
    console.error("Error Data:", errorData);
    console.error("Error Message:", errorData?.message || errorData?.error || error.message);
    
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

// 선생님 삭제
export const deleteTeacher = async (teacherId: number) => {
    const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/teacher/${teacherId}`);
    return response.data;
}