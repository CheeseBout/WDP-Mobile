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
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const url = `${process.env.EXPO_PUBLIC_BASE_API_URL}/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProductsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return { error: 'Failed to fetch products' };
  }
};

export const fetchProductById = async (id: string): Promise<Product | { error: string }> => {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return { error: 'Failed to fetch product' };
  }
};

export const fetchCategories = async (): Promise<CategoriesResponse | { error: string }> => {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CategoriesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { error: 'Failed to fetch categories' };
  }
};

// Add function to get all products for AI recommendations
export const fetchAllProductsForAI = async (): Promise<Product[] | { error: string }> => {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/products?limit=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProductsResponse = await response.json();
    return data.data.products;
  } catch (error) {
    console.error('Error fetching products for AI:', error);
    return { error: 'Failed to fetch products for AI' };
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
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews?productId=${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ReviewsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return { error: 'Failed to fetch product reviews' };
  }
};

export const createProductReview = async (reviewData: CreateReviewRequest): Promise<CreateReviewResponse | { error: string }> => {
  try {
    // Get the authentication token
    const token = await getStoredToken();
    if (!token) {
      return { error: "Authentication token not found. Please login again." };
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CreateReviewResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating product review:', error);
    return { error: 'Failed to create product review' };
  }
};