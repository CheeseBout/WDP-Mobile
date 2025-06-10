import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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

export interface CheckoutSelectedRequest {
  cart: {
    _id: string;
    userId: string;
    items: Array<{
      productId: string;
      price: number;
      quantity: number;
    }>;
    totalPrice: number;
  };
  bankCode: string;
  language: string;
}

export interface CheckoutSelectedResponse {
  success: boolean;
  message: string;
  data?: any;
  paymentUrl?: string;
  orderReference?: string;
  totalAmount?: number;
  currency?: string;
}

export interface CheckoutSelectedItemsRequest {
  productIds: string[];
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    isSuccess?: boolean;
    message?: string;
    orderId?: string;
    amount?: number;
    transactionId?: string;
    bankCode?: string;
    paymentTime?: string;
    responseCode?: string;
  };
}

const getAuthHeaders = async () => {
  try {
    // Get token from AsyncStorage - use 'authToken' key to match sign-in storage
    const token = await AsyncStorage.getItem('authToken');
    console.log('Token available for cart request:', !!token);
    
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
    
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/add-item`,
      request,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Add to cart response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    
    let errorMessage = 'Failed to add item to cart';
    if (error.response) {
      console.error('Cart API Error:', error.response.status, error.response.data);
      errorMessage = `Add to cart failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { success: false, message: errorMessage };
  }
};

export const removeFromCart = async (productId: string): Promise<CartResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await axios.delete(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/remove-item/${productId}`,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Remove from cart response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error removing from cart:', error);
    
    let errorMessage = 'Failed to remove item from cart';
    if (error.response) {
      console.error('Remove cart API Error:', error.response.status, error.response.data);
      errorMessage = `Remove from cart failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { success: false, message: errorMessage };
  }
};

export const clearCart = async (): Promise<CartResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await axios.delete(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/clear`,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Clear cart response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    
    let errorMessage = 'Failed to clear cart';
    if (error.response) {
      console.error('Clear cart API Error:', error.response.status, error.response.data);
      errorMessage = `Clear cart failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { success: false, message: errorMessage };
  }
};

export const getMyCart = async (): Promise<GetCartResponse | { error: string }> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Getting cart with headers:', headers);
    
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/my-cart`,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Get cart response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error getting cart:', error);
    
    let errorMessage = 'Failed to get cart';
    if (error.response) {
      console.error('Get Cart API Error:', error.response.status, error.response.data);
      errorMessage = `Get cart failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { error: errorMessage };
  }
};

export const checkout = async (request: CheckoutSelectedRequest): Promise<CheckoutSelectedResponse> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Checking out selected items with headers:', headers);
    console.log('Checkout payload:', JSON.stringify(request, null, 2));
    
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/payments/cart-checkout`,
      request,
      {
        headers,
        timeout: 30000, // Increased timeout for payment processing
      }
    );

    console.log('Checkout response:', response.data);
    
    // Return success with payment data
    return {
      success: true,
      message: 'Checkout successful',
      paymentUrl: response.data.paymentUrl,
      orderReference: response.data.orderReference,
      totalAmount: response.data.totalAmount,
      currency: response.data.currency,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error checking out selected items:', error);
    
    let errorMessage = 'Failed to checkout selected items';
    if (error.response) {
      console.error('Checkout Selected API Error:', error.response.status, error.response.data);
      errorMessage = `Checkout failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { success: false, message: errorMessage };
  }
};

// Store selected product IDs in AsyncStorage
export const storeSelectedItems = async (productIds: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem('selectedCartItems', JSON.stringify(productIds));
    console.log('Selected items stored:', productIds);
  } catch (error) {
    console.error('Error storing selected items:', error);
  }
};

// Retrieve selected product IDs from AsyncStorage
export const getSelectedItems = async (): Promise<string[]> => {
  try {
    const selectedItems = await AsyncStorage.getItem('selectedCartItems');
    return selectedItems ? JSON.parse(selectedItems) : [];
  } catch (error) {
    console.error('Error retrieving selected items:', error);
    return [];
  }
};

// Clear selected items from AsyncStorage
export const clearSelectedItems = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('selectedCartItems');
    console.log('Selected items cleared');
  } catch (error) {
    console.error('Error clearing selected items:', error);
  }
};

// Call checkout-selected API with stored product IDs
export const checkoutSelectedItems = async (): Promise<CartResponse> => {
  try {
    console.log('=== CHECKOUT-SELECTED API FLOW START ===');
    
    const productIds = await getSelectedItems();
    console.log('📦 Retrieved selected product IDs from AsyncStorage:', productIds);
    console.log('📦 Number of items to remove from cart:', productIds.length);
    
    if (productIds.length === 0) {
      console.log('❌ No items selected for checkout - returning early');
      return { success: false, message: 'No items selected for checkout' };
    }

    const headers = await getAuthHeaders();
    const apiUrl = `${process.env.EXPO_PUBLIC_BASE_API_URL}/cart/checkout-selected`;
    const payload = { productIds };
    
    console.log('🌐 Making API call to:', apiUrl);
    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
    console.log('🔑 Using headers:', headers);
    
    const response = await axios.post(apiUrl, payload, {
      headers,
      timeout: 10000,
    });

    console.log('✅ Checkout-selected API response received');
    console.log('📥 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.data?.items) {
      console.log('🛒 Items remaining in cart after checkout-selected:', response.data.data.items.length);
      console.log('💰 New cart total amount:', response.data.data.totalAmount);
    }
    
    console.log('=== CHECKOUT-SELECTED API FLOW END ===');
    return response.data;
  } catch (error: any) {
    console.log('=== CHECKOUT-SELECTED API ERROR ===');
    console.error('❌ Error in checkout-selected API:', error);
    
    let errorMessage = 'Failed to checkout selected items';
    if (error.response) {
      console.error('📛 API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url
      });
      errorMessage = `Checkout selected failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      console.error('📛 No response received from server');
      errorMessage = 'No response from server';
    } else {
      console.error('📛 Request setup error:', error.message);
    }
    
    return { success: false, message: errorMessage };
  }
};

export const verifyPayment = async (returnUrl?: string): Promise<VerifyPaymentResponse> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Verifying payment with return URL:', returnUrl);
    
    let queryParams: Record<string, string> = {};
    
    // If returnUrl is provided, extract query parameters from it
    if (returnUrl) {
      queryParams = extractQueryParamsFromUrl(returnUrl);
      console.log('Extracted query params for verification:', queryParams);
      
      // Validate that we have the required VNPay parameters
      if (!queryParams.vnp_TxnRef || !queryParams.vnp_Amount || !queryParams.vnp_ResponseCode) {
        console.error('Missing required VNPay parameters in return URL');
        return { 
          success: false, 
          message: 'Invalid payment return data. Missing required parameters.' 
        };
      }
    } else {
      console.error('No return URL provided for payment verification');
      return { 
        success: false, 
        message: 'Payment verification requires return URL with payment data.' 
      };
    }
    
    // Build URL with query parameters
    let url = `${process.env.EXPO_PUBLIC_BASE_API_URL}/payments/verify`;
    const searchParams = new URLSearchParams(queryParams);
    
    const response = await axios.get(url, {
      headers,
      params: queryParams,
      timeout: 10000,
    });

    console.log('Payment verification response:', response.data);
    
    return {
      success: true,
      message: 'Payment verification successful',
      data: response.data
    };
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    
    let errorMessage = 'Failed to verify payment';
    if (error.response) {
      console.error('Verify Payment API Error:', error.response.status, error.response.data);
      errorMessage = `Payment verification failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { success: false, message: errorMessage };
  }
};

// Add helper function to extract query params from URL string
export const extractQueryParamsFromUrl = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  try {
    // Handle both full URLs and just query strings
    let queryString = '';
    
    if (url.includes('?')) {
      queryString = url.split('?')[1];
    } else {
      // If no query string found, return empty params
      console.log('No query string found in URL:', url);
      return params;
    }
    
    // Parse the query string
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    console.log('Extracted params from URL:', params);
  } catch (error) {
    console.error('Error extracting query params from URL:', error);
  }
  return params;
};

// Add function to handle payment success from WebView
export const handlePaymentReturn = async (returnUrl: string): Promise<VerifyPaymentResponse> => {
  console.log('Processing payment return URL:', returnUrl);
  
  // Check if this is a VNPay return URL
  if (!returnUrl.includes('payment-result') && !returnUrl.includes('vnp_')) {
    console.log('URL does not appear to be a VNPay return URL');
    return { success: false, message: 'Invalid payment return URL' };
  }
  
  // Extract and validate parameters
  const params = extractQueryParamsFromUrl(returnUrl);
  
  // Check for VNPay success response
  if (params.vnp_ResponseCode === '00') {
    console.log('Payment appears successful, verifying...');
    return await verifyPayment(returnUrl);
  } else {
    console.log('Payment failed or cancelled, response code:', params.vnp_ResponseCode);
    return {
      success: false,
      message: 'Payment was not successful',
      data: {
        isSuccess: false,
        responseCode: params.vnp_ResponseCode,
        message: getVNPayResponseMessage(params.vnp_ResponseCode)
      }
    };
  }
};

// Helper function to get user-friendly VNPay response messages
const getVNPayResponseMessage = (responseCode: string): string => {
  const messages: Record<string, string> = {
    '00': 'Payment successful',
    '07': 'Deduct money successfully. Transaction suspected fraud (related to gray card/black card)',
    '09': 'Transaction failed: Customer\'s card/account has not registered Internet Banking service',
    '10': 'Transaction failed: Customer authentication information is incorrect more than 3 times',
    '11': 'Transaction failed: Payment deadline has expired',
    '12': 'Transaction failed: Customer\'s card/account is locked',
    '13': 'Transaction failed: Incorrect transaction authentication password',
    '24': 'Transaction failed: Customer canceled transaction',
    '51': 'Transaction failed: Customer\'s account has insufficient balance',
    '65': 'Transaction failed: Customer\'s account has exceeded daily transaction limit',
    '75': 'Payment bank is under maintenance',
    '79': 'Transaction failed: Customer entered payment password incorrectly more than allowed',
    '99': 'Other error'
  };
  
  return messages[responseCode] || 'Unknown error occurred';
};

// Add function to process payment return from WebView
export const processPaymentReturn = async (returnUrl: string): Promise<VerifyPaymentResponse> => {
  console.log('Processing payment return from WebView:', returnUrl);
  
  try {
    // Use the handlePaymentReturn function we already created
    const result = await handlePaymentReturn(returnUrl);
    console.log('Payment verification completed with result:', {
      success: result.success,
      isSuccess: result.data?.isSuccess,
      orderId: result.data?.orderId,
      transactionId: result.data?.transactionId,
      message: result.data?.message || result.message
    });
    
    return result;
  } catch (error) {
    console.error('Error processing payment return:', error);
    return { success: false, message: 'Failed to process payment return' };
  }
};
