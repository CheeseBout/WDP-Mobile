import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getProductById, RecommendedProduct } from '../../services/analyze.service';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
}

interface AnalysisData {
  userId: string;
  imageUrl: string;
  skinType: string;
  analysisDate: string;
  recommendedProducts: RecommendedProduct[];
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductWithDetails extends RecommendedProduct {
  productDetails?: Product;
  loading?: boolean;
}

export default function AnalysisScreen() {
  const router = useRouter()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [productsWithDetails, setProductsWithDetails] = useState<ProductWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, you would get this data from navigation params or storage
    // For now, we'll show a placeholder
    loadAnalysisResults()
  }, [])

  const loadAnalysisResults = async () => {
    try {
      setLoading(true)
      // This would typically come from navigation params or AsyncStorage
      // For demo purposes, showing placeholder data
      Alert.alert(
        'Demo Mode', 
        'This screen will show analysis results when accessed from the camera analysis flow.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error) {
      console.error('Error loading analysis results:', error)
      Alert.alert('Error', 'Failed to load analysis results')
    } finally {
      setLoading(false)
    }
  }

  const fetchProductDetails = async (products: RecommendedProduct[]) => {
    const updatedProducts: ProductWithDetails[] = products.map(product => ({
      ...product,
      loading: true
    }))
    
    setProductsWithDetails(updatedProducts)

    for (let i = 0; i < products.length; i++) {
      try {
        const productDetails = await getProductById(products[i].productId)
        
        setProductsWithDetails(prev => 
          prev.map((item, index) => 
            index === i 
              ? { ...item, productDetails: productDetails?.data, loading: false }
              : item
          )
        )
      } catch (error) {
        console.error(`Error fetching product ${products[i].productId}:`, error)
        
        setProductsWithDetails(prev => 
          prev.map((item, index) => 
            index === i 
              ? { ...item, loading: false }
              : item
          )
        )
      }
    }
  }

  const renderProductItem = ({ item }: { item: ProductWithDetails }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => {
        if (item.productDetails) {
          router.push(`/(tabs)/${item.productId}` as any)
        }
      }}
    >
      {item.loading ? (
        <View style={styles.productLoading}>
          <ActivityIndicator size="small" color="#1565C0" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      ) : item.productDetails ? (
        <>
          <Image 
            source={{ uri: item.productDetails.imageUrl }} 
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.productDetails.name}</Text>
            <Text style={styles.productPrice}>${item.productDetails.price}</Text>
            <Text style={styles.recommendationReason}>{item.reason}</Text>
            <Text style={styles.productCategory}>{item.productDetails.category}</Text>
          </View>
        </>
      ) : (
        <View style={styles.productError}>
          <Text style={styles.errorText}>Failed to load product details</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ title: 'Analysis Results' }} />
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Loading analysis results...</Text>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Analysis Results',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: 'white',
        }} 
      />
      <View style={styles.container}>
        {analysisData ? (
          <>
            <View style={styles.resultHeader}>
              <Image 
                source={{ uri: analysisData.imageUrl }} 
                style={styles.analyzedImage}
                resizeMode="cover"
              />
              <View style={styles.resultInfo}>
                <Text style={styles.skinTypeLabel}>Your Skin Type:</Text>
                <Text style={styles.skinType}>{analysisData.skinType.toUpperCase()}</Text>
                <Text style={styles.analysisDate}>
                  Analyzed on {new Date(analysisData.analysisDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>Recommended Products</Text>
              <FlatList
                data={productsWithDetails}
                keyExtractor={(item) => item._id}
                renderItem={renderProductItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
              />
            </View>
          </>
        ) : (
          <View style={styles.centerContent}>
            <Text style={styles.noDataText}>No analysis data available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAnalysisResults}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1565C0',
  },
  resultHeader: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    flexDirection: 'row',
  },
  analyzedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 15,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  skinTypeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  skinType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 10,
  },
  analysisDate: {
    fontSize: 12,
    color: '#90CAF9',
  },
  recommendationsSection: {
    flex: 1,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 15,
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  recommendationReason: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 12,
    color: '#90CAF9',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  productLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  productError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  noDataText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})