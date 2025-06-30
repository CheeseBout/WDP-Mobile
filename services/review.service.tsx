import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface Review {
  _id: string;
  productId: {
    _id: string;
    productName: string;
    price: number;
  };
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  content: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  content?: string;
}

export interface ReviewsResponse {
  success: boolean;
  code: number;
  data: Review[];
  message: string;
}

export interface SingleReviewResponse {
  success: boolean;
  code: number;
  data: Review;
  message: string;
}

export interface ReviewEligibilityResponse {
  data: {
    canReview: boolean;
    reason?: 'already_reviewed' | 'not_purchased';
  };
  message: string;
}

export interface ReviewResponse {
  success: boolean;
  code: number;
  data?: any;
  message: string;
}

const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    console.log('Token available for review request:', !!token);
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
};

// Check if user can review a product
export const checkReviewEligibility = async (productId: string): Promise<ReviewEligibilityResponse | { error: string }> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Checking review eligibility with headers:', headers);

    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews/eligibility/${productId}`,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Review eligibility response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error checking review eligibility:', error);

    let errorMessage = 'Failed to check review eligibility';
    if (error.response) {
      console.error('Review eligibility API Error:', error.response.status, error.response.data);
      errorMessage = `Check eligibility failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }

    return { error: errorMessage };
  }
};

// Create a new review
export const createReview = async (request: CreateReviewRequest): Promise<ReviewResponse> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Creating review:', request);

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews`,
      request,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Review created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating review:', error);
    return {
      success: false,
      code: 500,
      message: 'Failed to create review'
    };
  }
};

// Get all reviews with optional filters
export const getReviews = async (productId?: string, userId?: string): Promise<ReviewsResponse | { error: string }> => {
  try {
    const searchParams = new URLSearchParams();
    if (productId) searchParams.append('productId', productId);
    if (userId) searchParams.append('userId', userId);

    const url = `${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const headers = await getAuthHeaders();
    const response = await axios.get(url, {
      headers,
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    let errorMessage = 'Failed to fetch reviews';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    return { error: errorMessage };
  }
};

// Get review by ID
export const getReviewById = async (reviewId: string): Promise<SingleReviewResponse | { error: string }> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews/${reviewId}`,
      {
        headers,
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching review:', error);
    let errorMessage = 'Failed to fetch review';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    return { error: errorMessage };
  }
};

// Update a review
export const updateReview = async (reviewId: string, request: UpdateReviewRequest): Promise<ReviewResponse> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Updating review:', reviewId, request);

    const response = await axios.put(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews/${reviewId}`,
      request,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Review updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating review:', error);
    return {
      success: false,
      code: 500,
      message: 'Failed to update review'
    };
  }
};

// Delete a review
export const deleteReview = async (reviewId: string): Promise<ReviewResponse> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Deleting review:', reviewId);

    const response = await axios.delete(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews/${reviewId}`,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Review deleted successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return {
      success: false,
      code: 500,
      message: 'Failed to delete review'
    };
  }
};

// Get reviews for a specific product
export const getProductReviews = async (productId: string): Promise<ReviewsResponse | { error: string }> => {
  return getReviews(productId);
};

// Get reviews by a specific user
export const getUserReviews = async (userId: string): Promise<ReviewsResponse | { error: string }> => {
  return getReviews(undefined, userId);
};

// Calculate average rating from reviews
export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal place
};

// Get rating distribution
export const getRatingDistribution = (reviews: Review[]): Record<number, number> => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      distribution[review.rating as keyof typeof distribution]++;
    }
  });

  return distribution;
};

// Format review date
export const formatReviewDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Validate review content
export const validateReviewContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Review content cannot be empty' };
  }

  if (content.trim().length < 10) {
    return { isValid: false, error: 'Review must be at least 10 characters long' };
  }

  if (content.length > 1000) {
    return { isValid: false, error: 'Review cannot exceed 1000 characters' };
  }

  return { isValid: true };
};

// Validate rating
export const validateRating = (rating: number): { isValid: boolean; error?: string } => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { isValid: false, error: 'Rating must be a whole number between 1 and 5' };
  }

  return { isValid: true };
};

// Add quick review validation for inline input
export const validateQuickReview = (rating: number, content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate rating
  const ratingValidation = validateRating(rating);
  if (!ratingValidation.isValid) {
    errors.push(ratingValidation.error || 'Invalid rating');
  }

  // Validate content with more lenient requirements for inline input
  if (!content || content.trim().length === 0) {
    errors.push('Please share your thoughts about this product');
  } else if (content.trim().length < 5) {
    errors.push('Review must be at least 5 characters long');
  } else if (content.length > 1000) {
    errors.push('Review cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format validation errors for display
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 1) {
    return errors[0];
  }
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
}
