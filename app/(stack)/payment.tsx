import { processPaymentReturn } from '@/services/cart.service'
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

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState
    console.log('Navigation state changed:', url)

    // Check if this is the return URL from VNPay
    if (url.includes('payment-result') || url.includes('localhost:4000/payment-result')) {
      console.log('Payment return URL detected, processing...')
      
      // Prevent processing the same URL multiple times
      if (processedUrls.has(url)) {
        console.log('URL already processed, ignoring:', url)
        return
      }
      
      // Add URL to processed set
      setProcessedUrls(prev => new Set([...prev, url]))
      
      if (processing) {
        console.log('Already processing payment, ignoring duplicate...')
        return
      }

      setProcessing(true)

      try {
        // Call processPaymentReturn with the complete return URL
        const result = await processPaymentReturn(url)
        
        if (result.success && result.data?.isSuccess) {
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
          Alert.alert(
            'Payment Failed',
            result.data?.message || result.message || 'Payment verification failed. Please contact support.',
            [
              {
                text: 'Try Again',
                onPress: () => {
                  // Clear processed URLs to allow retry
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
        setProcessing(false)
      }
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
