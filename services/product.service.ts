import axios from 'axios';
import { getStoredToken } from './auth.service';

export interface Product {
  id: string;
  productName: string;
  productDescription: string;
  price: number;
  stock: number;
  category: string[];
  brand: string;
  productImages: string[];
  ingredients: string;
  suitableFor: string;
  salePercentage: number;
  expiryDate: string;
  reviews: any[];
  createdAt: string;
  updatedAt: string;
  averageRating: number;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    total: number;
  };
  message: string;
}

export interface ProductsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface Category {
  _id: string;
  categoryName: string;
  categoryDescription: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
    total: number;
  };
  message: string;
}

export interface ReviewUser {
  _id: string;
  email: string;
  fullName: string;
}

export interface ReviewProduct {
  productName: string;
  price: number;
  id: string;
}

export interface Review {
  _id: string;
  userId: ReviewUser;
  productId: ReviewProduct;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ReviewsResponse {
  success: boolean;
  data: Review[];
  message: string;
}

export interface CreateReviewRequest {
  productId: string;
  userId: string;
  rating: number;
  content: string;
}

export interface CreateReviewResponse {
  success: boolean;
  data: Review;
  message: string;
}

export const fetchProducts = async (params?: ProductsParams): Promise<ProductsResponse | { error: string }> => {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/products`,
      {
        params,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Fetch products response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching products:', error);
    
    let errorMessage = 'Failed to fetch products';
    if (error.response) {
      errorMessage = `Fetch products failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { error: errorMessage };
  }
};

export const fetchProductById = async (id: string): Promise<Product | { error: string }> => {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/products/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Fetch product by ID response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching product:', error);
    
    let errorMessage = 'Failed to fetch product';
    if (error.response) {
      errorMessage = `Fetch product failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { error: errorMessage };
  }
};

export const fetchCategories = async (): Promise<CategoriesResponse | { error: string }> => {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/categories`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Fetch categories response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    
    let errorMessage = 'Failed to fetch categories';
    if (error.response) {
      errorMessage = `Fetch categories failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { error: errorMessage };
  }
};

// Add function to get all products for AI recommendations
export const fetchAllProductsForAI = async (): Promise<Product[] | { error: string }> => {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/products`,
      {
        params: { limit: 100 },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Fetch products for AI response:', response.data);
    return response.data.data.products;
  } catch (error: any) {
    console.error('Error fetching products for AI:', error);
    
    let errorMessage = 'Failed to fetch products for AI';
    if (error.response) {
      errorMessage = `Fetch products for AI failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { error: errorMessage };
  }
};

// Add function to search products by name or category for AI
export const searchProductsForAI = (products: Product[], query: string): Product[] => {
  try {
    const lowercaseQuery = query.toLowerCase();
    return products.filter(product => {
      // Check product name
      if (product.productName && product.productName.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Check brand
      if (product.brand && product.brand.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Check categories - handle potential undefined values
      if (product.category && Array.isArray(product.category)) {
        const hasMatchingCategory = product.category.some(cat => 
          cat && typeof cat === 'string' && cat.toLowerCase().includes(lowercaseQuery)
        );
        if (hasMatchingCategory) {
          return true;
        }
      }
      
      // Check product description
      if (product.productDescription && product.productDescription.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Check suitable for
      if (product.suitableFor && product.suitableFor.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Check for common skincare/health terms
      const searchTerms = [
        'acne', 'anti-aging', 'moisturizer', 'cleanser', 'serum', 'cream', 'lotion',
        'vitamin', 'supplement', 'pain', 'relief', 'skincare', 'face', 'skin',
        'dry', 'oily', 'sensitive', 'wrinkle', 'spot', 'blemish', 'hydrating'
      ];
      
      const hasMatchingTerm = searchTerms.some(term => {
        return (
          (product.productName && product.productName.toLowerCase().includes(term) && query.toLowerCase().includes(term)) ||
          (product.productDescription && product.productDescription.toLowerCase().includes(term) && query.toLowerCase().includes(term)) ||
          (product.suitableFor && product.suitableFor.toLowerCase().includes(term) && query.toLowerCase().includes(term))
        );
      });
      
      return hasMatchingTerm;
    });
  } catch (error) {
    console.error('Error searching products for AI:', error);
    return [];
  }
};

export const fetchProductReviews = async (productId: string): Promise<ReviewsResponse | { error: string }> => {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews`,
      {
        params: { productId },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Fetch product reviews response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching product reviews:', error);
    
    let errorMessage = 'Failed to fetch product reviews';
    if (error.response) {
      errorMessage = `Fetch reviews failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { error: errorMessage };
  }
};

export const createProductReview = async (reviewData: CreateReviewRequest): Promise<CreateReviewResponse | { error: string }> => {
  try {
    // Get the authentication token
    const token = await getStoredToken();
    if (!token) {
      return { error: "Authentication token not found. Please login again." };
    }

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews`,
      reviewData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    console.log('Create product review response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating product review:', error);
    
    let errorMessage = 'Failed to create product review';
    if (error.response) {
      errorMessage = `Create review failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { error: errorMessage };
  }
};