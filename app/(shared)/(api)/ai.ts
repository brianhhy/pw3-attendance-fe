import axios from "./apiClient";

const AI_API_BASE_URL = process.env.API_URL;

export const sendChatMessage = async (question: string) => {
  const response = await axios.post(`${AI_API_BASE_URL}/ai/chat`, {
    question,
  });
  return response.data;
};
