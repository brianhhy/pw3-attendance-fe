import axios from "axios";

export interface BirthdayStudent {
  id: number;
  name: string;
  birth: [number, number, number];
  className: string;
  phone: string;
}

export interface BirthdayTeacher {
  id: number;
  name: string;
  birth: [number, number, number];
  phone: string;
}

export interface BirthdayResponse {
  month: number;
  students: BirthdayStudent[];
  teachers: BirthdayTeacher[];
}

export const getBirthdays = async (month: number): Promise<BirthdayResponse> => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/birthday/${month}`
  );
  return response.data;
};
