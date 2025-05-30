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
