import axios from "axios";

const AI_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const sendChatMessage = async (question: string) => {
  const response = await axios.post(`${AI_API_BASE_URL}/ai/chat`, {
    question,
  });
  return response.data;
};
