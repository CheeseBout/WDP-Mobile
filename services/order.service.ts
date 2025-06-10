import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productDetails: {
    productName: string;
    price: number;
    id: string;
  };
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
  subtotal: number;
}

export interface Transaction {
  _id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDetails: {
    userId: string;
    cartId: string;
    ipAddr: string;
    bankCode: string;
    cardType: string;
    transactionNo: string;
    payDate: string;
    responseCode: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Order {
  _id: string;
  userId: {
    _id: string;
    email: string;
    phone: string;
    address: string;
  };
  transactionId: Transaction;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
  items: OrderItem[];
  itemCount: number;
  totalQuantity: number;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  message: string;
}

const getAuthHeaders = async () => {
  try {
    // Get token from AsyncStorage - use 'authToken' key to match sign-in storage
    const token = await AsyncStorage.getItem('authToken');
    console.log('Token available for order request:', !!token);
    
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

export const getUserOrders = async (): Promise<OrdersResponse | { error: string }> => {
  try {
    const headers = await getAuthHeaders();
    console.log('Getting user orders with headers:', headers);
    
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_BASE_API_URL}/orders/by-user`,
      {
        headers,
        timeout: 10000,
      }
    );

    console.log('Get orders response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error getting user orders:', error);
    
    let errorMessage = 'Failed to get user orders';
    if (error.response) {
      console.error('Get Orders API Error:', error.response.status, error.response.data);
      errorMessage = `Get orders failed: ${error.response.status}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return { error: errorMessage };
  }
};
