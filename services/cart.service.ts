import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface CartItemWithProduct {
  productId: {
    _id: string;
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
    __v: number;
  };
  quantity: number;
  price: number;
  _id: string;
}

export interface UserCart {
  _id: string;
  userId: string;
  items: CartItemWithProduct[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GetCartResponse {
  success: boolean;
  data: UserCart;
  message: string;
}

const getAuthHeaders = async () => {
  try {
    // Get token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
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

export const addToCart = async (request: AddToCartRequest): Promise<CartResponse> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Adding to cart with headers:', headers);
    
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/add-item`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cart API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CartResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, message: 'Failed to add item to cart' };
  }
};

export const removeFromCart = async (productId: string): Promise<CartResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/remove-item/${productId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CartResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, message: 'Failed to remove item from cart' };
  }
};

export const clearCart = async (): Promise<CartResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/clear`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CartResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, message: 'Failed to clear cart' };
  }
};

export const getMyCart = async (): Promise<GetCartResponse | { error: string }> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Getting cart with headers:', headers);
    
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/my-cart`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get Cart API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GetCartResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting cart:', error);
    return { error: 'Failed to get cart' };
  }
};
