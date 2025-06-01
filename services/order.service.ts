import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const token = await AsyncStorage.getItem('authToken');
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
    
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_API_URL}/orders/by-user`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get Orders API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OrdersResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'Failed to fetch orders' };
  }
};
