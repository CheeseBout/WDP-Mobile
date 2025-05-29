import axios from "axios";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Platform } from "react-native";
import { storage } from "../configs/firebase.config";

export interface AnalysisResult {
  prediction?: {
    predictionIndex?: number;
    skinType?: string;
  };
  error?: string;
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
    // Convert URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

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
 * Sends an image to the prediction API
 * @param imageUri The local URI of the image
 * @returns Promise with the analysis result
 */
export const analyzeImage = async (
  imageUri: string
): Promise<AnalysisResult> => {
  try {
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
    const response = await axios.post(
      `${process.env.apiBaseUrl}/predict`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Server response:", response.data);
    return response.data;
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
    }

    return { error: errorMessage };
  }
};
