import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getStoredToken } from "./auth.service";

export interface ChatHistory {
  _id: string;
  userId: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
  title?: string;
  __v: number;
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  sender: "user" | "ai";
  messageContent: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: ChatHistory[];
  message: string;
}

export interface ChatMessageResponse {
  success: boolean;
  data: ChatMessage[];
  message: string;
}

export interface CreateChatHistoryResponse {
  success: boolean;
  code: number;
  data: ChatHistory;
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  code: number;
  data: ChatMessage;
  message: string;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_BASE_API_URL || "http://localhost:3000";

// Gemini API integration
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const fetchUserChatHistory = async (
  userId: string
): Promise<ChatHistoryResponse | { error: string }> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { error: "Authentication token not found" };
    }
    const url = `${API_BASE_URL}/chat-history/user/${userId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        error: error.response.data.message || "Failed to fetch chat history",
      };
    }
    return { error: "Network error occurred" };
  }
};

export const createChatHistory = async (
  userId: string
): Promise<CreateChatHistoryResponse | { error: string }> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { error: "Authentication token not found" };
    }
    const url = `${API_BASE_URL}/chat-history/${userId}`;
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        error: error.response.data.message || "Failed to create chat history",
      };
    }
    return { error: "Network error occurred" };
  }
};

export const sendMessage = async (
  chatId: string,
  messageContent: string
): Promise<SendMessageResponse | { error: string }> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { error: "Authentication token not found" };
    }
    const userData = await AsyncStorage.getItem("user");
    if (!userData) {
      return { error: "User not found. Please log in again." };
    }
    const user = JSON.parse(userData);
    const userId = user.id || user._id || user.userId;
    if (!userId) {
      return { error: "User ID not found. Please log in again." };
    }
    const url = `${API_BASE_URL}/chat-messages`;
    const body = {
      chatId,
      userId,
      sender: "user",
      messageContent,
    };
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return { error: error.response.data.message || "Failed to send message" };
    }
    return { error: "Network error occurred" };
  }
};

export const fetchChatMessages = async (
  chatId: string
): Promise<ChatMessageResponse | { error: string }> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { error: "Authentication token not found" };
    }
    const url = `${API_BASE_URL}/chat-messages/chat/${chatId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        error: error.response.data.message || "Failed to fetch chat messages",
      };
    }
    return { error: "Network error occurred" };
  }
};

// Delete chat history
export const deleteChatHistory = async (
  chatHistoryId: string
): Promise<{ success?: boolean; message?: string; error?: string }> => {
  try {
    const token = await getStoredToken();
    if (!token) return { error: "Authentication token not found" };
    const url = `${API_BASE_URL}/chat-history/${chatHistoryId}`;
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return { success: true, message: response.data.message };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        error: error.response.data.message || "Failed to delete chat history",
      };
    }
    return { error: "Network error occurred" };
  }
};

// Gemini AI REST API call
export const getGeminiAIResponse = async (
  prompt: string
): Promise<string | null> => {
  try {
    if (!GEMINI_API_KEY) {
      return null;
    }
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    return null;
  }
};

// Save AI message to backend
export const sendAIMessage = async (
  chatId: string,
  messageContent: string
): Promise<SendMessageResponse | { error: string }> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { error: "Authentication token not found" };
    }
    const userData = await AsyncStorage.getItem("user");
    if (!userData) {
      return { error: "User not found. Please log in again." };
    }
    const user = JSON.parse(userData);
    const userId = user.id || user._id || user.userId;
    if (!userId) {
      return { error: "User ID not found. Please log in again." };
    }
    const url = `${API_BASE_URL}/chat-messages`;
    const body = {
      chatId,
      userId,
      sender: "ai",
      messageContent,
    };
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        error: error.response.data.message || "Failed to send AI message",
      };
    }
    return { error: "Network error occurred" };
  }
};
