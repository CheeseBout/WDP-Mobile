import AsyncStorage from '@react-native-async-storage/async-storage'
import { getStoredToken } from './auth.service'

export interface ChatHistory {
  _id: string
  userId: string
  messages: any[]
  createdAt: string
  updatedAt: string
  __v: number
}

export interface ChatMessage {
  _id: string
  chatId: string
  sender: 'user' | 'ai'
  messageContent: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface ChatHistoryResponse {
  success: boolean
  data: ChatHistory[]
  message: string
}

export interface ChatMessageResponse {
  success: boolean
  data: ChatMessage[]
  message: string
}

export interface CreateChatHistoryResponse {
  success: boolean
  code: number
  data: ChatHistory
  message: string
}

export interface SendMessageResponse {
  success: boolean
  code: number
  data: ChatMessage
  message: string
}

const API_BASE_URL = process.env.EXPO_PUBLIC_BASE_API_URL || 'http://localhost:3000'

export const fetchUserChatHistory = async (userId: string): Promise<ChatHistoryResponse | { error: string }> => {
  try {
    console.log('=== Fetching User Chat History ===')
    console.log('API_BASE_URL:', API_BASE_URL)
    console.log('User ID:', userId)
    
    const token = await getStoredToken()
    console.log('Token available:', !!token)
    
    if (!token) {
      console.log('❌ No authentication token found')
      return { error: 'Authentication token not found' }
    }

    const url = `${API_BASE_URL}/chat-history/user/${userId}`
    console.log('Request URL:', url)
    
    const requestConfig = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
    console.log('Request config:', requestConfig)

    console.log('Making fetch request...')
    const response = await fetch(url, requestConfig)
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)

    const data = await response.json()
    console.log('Response data:', data)

    if (!response.ok) {
      console.log('❌ Request failed:', data.message || 'Failed to fetch chat history')
      return { error: data.message || 'Failed to fetch chat history' }
    }

    console.log('✅ Chat history fetched successfully')
    return data
  } catch (error) {
    console.error('❌ Error fetching chat history:', error)
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    })
    return { error: 'Network error occurred' }
  }
}

export const createChatHistory = async (userId: string): Promise<CreateChatHistoryResponse | { error: string }> => {
  try {
    console.log('=== Creating Chat History ===')
    console.log('User ID:', userId)
    
    const token = await getStoredToken()
    console.log('Token available:', !!token)
    
    if (!token) {
      console.log('❌ No authentication token found')
      return { error: 'Authentication token not found' }
    }

    const url = `${API_BASE_URL}/chat-history/${userId}`
    console.log('Request URL:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    console.log('Response status:', response.status)

    const data = await response.json()
    console.log('Response data:', data)

    if (!response.ok) {
      console.log('❌ Request failed:', data.message || 'Failed to create chat history')
      return { error: data.message || 'Failed to create chat history' }
    }

    console.log('✅ Chat history created successfully')
    return data
  } catch (error) {
    console.error('❌ Error creating chat history:', error)
    return { error: 'Network error occurred' }
  }
}

export const sendMessage = async (chatId: string, messageContent: string): Promise<SendMessageResponse | { error: string }> => {
  try {
    console.log('=== Sending Message ===')
    console.log('Chat ID:', chatId)
    console.log('Message content:', messageContent)
    
    const token = await getStoredToken()
    console.log('Token available:', !!token)
    
    if (!token) {
      console.log('❌ No authentication token found')
      return { error: 'Authentication token not found' }
    }

    // Get user ID from storage
    const userData = await AsyncStorage.getItem('user')
    console.log('User data from storage:', userData)
    
    if (!userData) {
      console.log('❌ No user data found in storage')
      return { error: 'User not found. Please log in again.' }
    }

    const user = JSON.parse(userData)
    console.log('Parsed user object:', user)
    
    const userId = user.id || user._id || user.userId
    console.log('Extracted user ID:', userId)
    
    if (!userId) {
      console.log('❌ No user ID found in user data')
      return { error: 'User ID not found. Please log in again.' }
    }

    const url = `${API_BASE_URL}/chat-messages`
    console.log('Request URL:', url)
    
    const body = {
      chatId,
      userId,
      sender: 'user',
      messageContent,
    }
    console.log('Request body:', body)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    console.log('Response status:', response.status)

    const data = await response.json()
    console.log('Response data:', data)

    if (!response.ok) {
      console.log('❌ Request failed:', data.message || 'Failed to send message')
      return { error: data.message || 'Failed to send message' }
    }

    console.log('✅ Message sent successfully')
    return data
  } catch (error) {
    console.error('❌ Error sending message:', error)
    return { error: 'Network error occurred' }
  }
}

export const fetchChatMessages = async (chatId: string): Promise<ChatMessageResponse | { error: string }> => {
  try {
    console.log('=== Fetching Chat Messages ===')
    console.log('Chat ID:', chatId)
    
    const token = await getStoredToken()
    console.log('Token available:', !!token)
    
    if (!token) {
      console.log('❌ No authentication token found')
      return { error: 'Authentication token not found' }
    }

    const url = `${API_BASE_URL}/chat-messages/chat/${chatId}`
    console.log('Request URL:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    console.log('Response status:', response.status)

    const data = await response.json()
    console.log('Response data:', data)

    if (!response.ok) {
      console.log('❌ Request failed:', data.message || 'Failed to fetch chat messages')
      return { error: data.message || 'Failed to fetch chat messages' }
    }

    console.log('✅ Chat messages fetched successfully')
    return data
  } catch (error) {
    console.error('❌ Error fetching chat messages:', error)
    return { error: 'Network error occurred' }
  }
}