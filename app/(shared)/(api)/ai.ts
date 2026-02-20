import axios from "axios";

const AI_API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL;

export const sendChatMessage = async (query: string) => {
  const response = await axios.get(`${AI_API_BASE_URL}/ask`, {
    params: {
      query: query,
    },
  });
  return response.data;
};
