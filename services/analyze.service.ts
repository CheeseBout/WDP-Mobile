import axios from "axios";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Platform } from "react-native";
import { storage } from "../configs/firebase.config";
import { getStoredToken } from "./auth.service";

export interface RecommendedProduct {
  recommendationId: string;
  productId: string;
  reason: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResult {
  analysis?: {
    userId: string;
    imageUrl: string;
    skinType: string;
    analysisDate: string;
    recommendedProducts: RecommendedProduct[];
    _id: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

interface ServerResponse {
  success: boolean;
  data: {
    userId: string;
    imageUrl: string;
    skinType: string;
    analysisDate: string;
    recommendedProducts: RecommendedProduct[];
    _id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }
  message: string;
}

export interface AnalysisHistoryItem {
  _id: string;
  userId: string;
  imageUrl: string;
  skinType: string;
  analysisDate: string;
  recommendedProducts: RecommendedProduct[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AnalysisHistoryResponse {
  success: boolean;
  data: AnalysisHistoryItem[];
  message: string;
}

/**
 * Uploads an image to Firebase Storage
 * @param imageUri The local URI of the image
 * @returns Promise with the download URL
 */
export const uploadImageToFirebase = async (
  imageUri: string
): Promise<string> => {
  try {
    // Convert URI to blob using axios instead of fetch
    const response = await axios.get(imageUri, {
      responseType: "blob",
    });
    const blob = response.data;

    // Create a unique filename
    const filename = `skin_image_${new Date().getTime()}.jpg`;
    const storageRef = ref(storage, `WDP/${filename}`);

    // Upload to Firebase
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading image to Firebase:", error);
    throw error;
  }
};

/**
 * Sends an image to the analysis API
 * @param imageUri The local URI of the image
 * @returns Promise with the analysis result
 */
export const analyzeImage = async (
  imageUri: string
): Promise<AnalysisResult> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { error: "Authentication token not found. Please login again." };
    }

    const formData = new FormData();

    // Extract file name from URI to provide a proper name for the server
    const uriParts = imageUri.split("/");
    const fileName = uriParts[uriParts.length - 1];

    // Check if it's iOS or Android to properly format the file object
    // @ts-ignore - React Native specific format for FormData
    formData.append("file", {
      uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
      name: fileName || "photo.jpg",
      type: "image/jpeg",
    });

    // Use a timeout to prevent hanging requests
    const response = await axios.post<ServerResponse>(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/analyse/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 30000, // Increased timeout for image processing
      }
    );

    console.log("Server response:", response.data);

    // Transform server response to match your interface
    if (response.data.success && response.data.data) {
      return {
        analysis: response.data.data
      };
    } else {
      return { error: response.data.message || "Analysis failed" };
    }
  } catch (error: any) {
    console.error("Error analyzing image:", error);

    // Provide more detailed error information
    let errorMessage = "Failed to analyze image";
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      errorMessage = `Server error: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "No response from server";
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      errorMessage = "Request timeout - server took too long to respond";
    }

    return { error: errorMessage };
  }
};

/**
 * Get product details by ID
 * @param productId The product ID
 * @returns Promise with product details
 */
export const getProductById = async (productId: string) => {
  try {
    const token = await getStoredToken();
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/products/${productId}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching product details:", error);
    return null;
  }
};

/**
 * Get user's analysis history
 * @returns Promise with analysis history or null
 */
export const getUserAnalysisHistory = async (): Promise<AnalysisHistoryResponse | null> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.error("No authentication token found");
      return null;
    }

    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/analyse/user-analyses`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Analysis history response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching analysis history:", error);
    return null;
  }
}