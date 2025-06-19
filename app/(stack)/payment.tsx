import { checkoutSelectedItems, clearSelectedItems, getSelectedItems, processPaymentReturn } from '@/services/cart.service'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useRef, useState } from 'react'
import { ActivityIndicator, Alert, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { WebView } from 'react-native-webview'

export default function PaymentScreen() {
  const { paymentUrl, orderReference, totalAmount } = useLocalSearchParams<{
    paymentUrl: string
    orderReference: string
    totalAmount: string
  }>()

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [processedUrls, setProcessedUrls] = useState<Set<string>>(new Set())
  const webViewRef = useRef<WebView>(null)
  
  // Use refs for immediate state tracking to prevent race conditions
  const isProcessingRef = useRef(false)
  const hasProcessedPaymentRef = useRef(false)

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState
    console.log('Navigation state changed:', url)

    // Early return if payment has already been processed successfully
    if (hasProcessedPaymentRef.current) {
      console.log('Payment already processed successfully, ignoring navigation')
      return
    }

    // More specific URL pattern check to avoid false positives
    const isPaymentReturnUrl = url.includes('payment-result') && 
                              (url.includes('vnp_') || url.includes('ResponseCode') || url.includes('TransactionStatus'))
    
    if (!isPaymentReturnUrl) {
      return
    }

    console.log('Payment return URL detected, processing...')
    
    // Immediate check and set using ref to prevent race conditions
    if (isProcessingRef.current) {
      console.log('Already processing payment (ref check), ignoring duplicate...')
      return
    }

    // Check if this exact URL has been processed
    if (processedUrls.has(url)) {
      console.log('URL already processed, ignoring:', url)
      return
    }

    // Set processing flag immediately
    isProcessingRef.current = true
    setProcessing(true)
    
    // Add URL to processed set immediately
    setProcessedUrls(prev => new Set([...prev, url]))

    try {
      console.log('Starting payment verification process...')
      
      // Call processPaymentReturn with the complete return URL
      const result = await processPaymentReturn(url)
      console.log('Payment verification result:', result)
      
      if (result.success && result.data?.isSuccess) {
        // Mark payment as successfully processed
        hasProcessedPaymentRef.current = true
        
        console.log('Payment verified successfully, now calling checkout-selected API...')
        
        // Get selected items from AsyncStorage
        const selectedItems = await getSelectedItems()
        console.log('Retrieved selected items from AsyncStorage:', selectedItems)
        
        if (selectedItems && selectedItems.length > 0) {
          console.log('Calling checkout-selected API to remove selected items from cart...')
          
          // Call checkout-selected API to remove only selected items
          const checkoutResult = await checkoutSelectedItems()
          console.log('Checkout-selected API result:', checkoutResult)
          
          if (checkoutResult.success) {
            console.log('Selected items successfully removed from cart')
            // Clear selected items from AsyncStorage after successful removal
            await clearSelectedItems()
            console.log('Selected items cleared from AsyncStorage')
          } else {
            console.error('Failed to remove selected items from cart:', checkoutResult.message)
          }
        } else {
          console.log('No selected items found in AsyncStorage to remove')
        }

        Alert.alert(
          'Payment Successful!',
          `Order #${result.data.orderId || result.data.transactionId} has been created and is pending staff confirmation.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to cart to see updated state
                router.replace('/(tabs)/cart')
              }
            }
          ]
        )
      } else {
        console.log('Payment verification failed:', result)
        Alert.alert(
          'Payment Failed',
          result.data?.message || result.message || 'Payment verification failed. Please contact support.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                // Reset all processing flags for retry
                isProcessingRef.current = false
                hasProcessedPaymentRef.current = false
                setProcessedUrls(new Set())
                if (webViewRef.current && paymentUrl) {
                  webViewRef.current.reload()
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => router.back()
            }
          ]
        )
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      Alert.alert(
        'Error',
        'Failed to process payment. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      )
    } finally {
      isProcessingRef.current = false
      setProcessing(false)
    }
  }

  const handleLoadEnd = () => {
    setLoading(false)
  }

  const handleError = () => {
    setLoading(false)
    Alert.alert(
      'Error',
      'Failed to load payment page. Please check your internet connection.',
      [
        {
          text: 'Retry',
          onPress: () => {
            setLoading(true)
            if (webViewRef.current) {
              webViewRef.current.reload()
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => router.back()
        }
      ]
    )
  }

  if (!paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorText}>No payment URL provided</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1565C0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Payment Info */}
      <View style={styles.paymentInfo}>
        <Text style={styles.orderText}>Order: {orderReference}</Text>
        <Text style={styles.amountText}>
          Amount: {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
          }).format(parseInt(totalAmount || '0'))}
        </Text>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1565C0" />
            <Text style={styles.loadingText}>Loading payment page...</Text>
          </View>
        )}

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#1565C0" />
            <Text style={styles.processingText}>Processing payment...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          startInLoadingState={true}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={false}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 40,
  },
  paymentInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFE',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1565C0',
    textAlign: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 18,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    color: '#1565C0',
    fontSize: 16,
    fontWeight: '600',
  },
})
