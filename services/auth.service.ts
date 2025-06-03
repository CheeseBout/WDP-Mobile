import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

export interface User {
  email: string;
  fullName?: string | null;
  phone: string | null;
  address: string | null;
  dob: string | null;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  role?: "guest" | "customer" | "staff" | "admin";
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface AuthError {
  error: string;
}

export interface GoogleLoginRequest {
  email: string;
  fullName: string;
  googleId: string;
  photo?: string;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  dob: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  role?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  code: number;
  data: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    phone: string | null;
    address: string | null;
    updatedAt: string;
  };
  message: string;
}

/**
 * Get current user profile
 * @param token Authentication token
 * @returns Promise with user profile or error
 */
export const getUserProfile = async (token: string): Promise<UserProfileResponse | AuthError> => {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/auth/my-profile`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Profile response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching profile:", error);

    let errorMessage = "Failed to fetch profile";
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      errorMessage = `Profile fetch failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = "No response from server";
    }

    return { error: errorMessage };
  }
};

/**
 * Login user with email and password
 * @param credentials Login credentials
 * @returns Promise with login response or error
 */
export const loginUser = async (
  credentials: LoginRequest
): Promise<LoginResponse | AuthError> => {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/auth/login`,
      credentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Login response:", response.data);
    
    // Store token in AsyncStorage after successful login
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      console.log('Token stored in AsyncStorage');
      
      // Fetch and store user profile
      const profileResult = await getUserProfile(response.data.token);
      if (!('error' in profileResult)) {
        await AsyncStorage.setItem('user', JSON.stringify(profileResult));
        console.log('User profile stored in AsyncStorage:', profileResult);
      } else {
        console.error('Failed to fetch profile:', profileResult.error);
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error("Error logging in:", error);

    let errorMessage = "Failed to login";
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      errorMessage = `Login failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = "No response from server";
    }

    return { error: errorMessage };
  }
};

/**
 * Register new user
 * @param userData Registration data
 * @returns Promise with register response or error
 */
export const registerUser = async (
  userData: RegisterRequest
): Promise<RegisterResponse | AuthError> => {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/auth/register`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Register response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error registering:", error);

    let errorMessage = "Failed to register";
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      errorMessage = `Registration failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = "No response from server";
    }

    return { error: errorMessage };
  }
};

export const loginWithGoogle = async (
  googleData: GoogleLoginRequest
): Promise<LoginResponse | AuthError> => {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/auth/google-login`,
      googleData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    console.log("Google login response:", response.data);
    
    // Store token in AsyncStorage after successful Google login
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      console.log('Google token stored in AsyncStorage');
      
      // Fetch and store user profile
      const profileResult = await getUserProfile(response.data.token);
      if (!('error' in profileResult)) {
        await AsyncStorage.setItem('user', JSON.stringify(profileResult));
        console.log('Google user profile stored in AsyncStorage:', profileResult);
      } else {
        console.error('Failed to fetch Google profile:', profileResult.error);
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error("Error logging in with Google:", error);

    let errorMessage = "Failed to login with Google";
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      errorMessage = `Google login failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = "No response from server";
    }
    return { error: errorMessage };
  }
};

/**
 * Update user profile
 * @param userId User ID to update
 * @param updateData Data to update
 * @param token Authentication token
 * @returns Promise with updated user profile or error
 */
export const updateUserProfile = async (
  userId: string,
  updateData: UpdateUserRequest,
  token: string
): Promise<UpdateUserResponse | AuthError> => {
  try {
    const response = await axios.patch(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/users/${userId}`,
      updateData,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Update profile response:", response.data);
    
    // Update stored user data if successful
    if (response.data.success && response.data.data) {
      // Get current user data to preserve dob
      const currentUserData = await AsyncStorage.getItem('user');
      let currentDob = null;
      if (currentUserData) {
        const parsedCurrentUser = JSON.parse(currentUserData);
        currentDob = parsedCurrentUser.dob;
      }

      const updatedProfile = {
        id: response.data.data._id,
        fullName: response.data.data.fullName,
        email: response.data.data.email,
        role: response.data.data.role,
        phone: response.data.data.phone,
        address: response.data.data.address,
        dob: currentDob, // Preserve existing dob
        createdAt: new Date().toISOString(),
        updatedAt: response.data.data.updatedAt,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedProfile));
      console.log('Updated user profile stored in AsyncStorage');
    }
    
    return response.data;
  } catch (error: any) {
    console.error("Error updating profile:", error);

    let errorMessage = "Failed to update profile";
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      errorMessage = `Update failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = "No response from server";
    }

    return { error: errorMessage };
  }
};

/**
 * Logout user and clear stored token
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('token');
    console.log('Token removed from AsyncStorage');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

/**
 * Get stored token from AsyncStorage
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

