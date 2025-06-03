import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AnalysisHistoryItem, getProductById, getUserAnalysisHistory, RecommendedProduct } from '../../services/analyze.service';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
}

interface ProductWithDetails extends RecommendedProduct {
  productDetails?: Product;
  loading?: boolean;
}

interface AnalysisWithProducts extends AnalysisHistoryItem {
  productsWithDetails?: ProductWithDetails[];
  productsLoading?: boolean;
  expanded?: boolean;
}

export default function AnalysisScreen() {
  const router = useRouter();
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      setLoading(true);
      const response = await getUserAnalysisHistory();
      
      if (response && response.success) {
        const historyWithProducts = response.data.map(item => ({
          ...item,
          expanded: false,
          productsLoading: false,
          productsWithDetails: []
        }));
        setAnalysisHistory(historyWithProducts);
      } else {
        setAnalysisHistory([]);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setAnalysisHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalysisHistory();
    setRefreshing(false);
  };

  const fetchProductsForAnalysis = async (analysisId: string, products: RecommendedProduct[]) => {
    // Set loading state for this analysis
    setAnalysisHistory(prev => 
      prev.map(item => 
        item._id === analysisId 
          ? { ...item, productsLoading: true, productsWithDetails: products.map(p => ({ ...p, loading: true })) }
          : item
      )
    );

    // Fetch product details
    for (let i = 0; i < products.length; i++) {
      try {
        const productDetails = await getProductById(products[i].productId);
        
        setAnalysisHistory(prev => 
          prev.map(item => {
            if (item._id === analysisId && item.productsWithDetails) {
              const updatedProducts = [...item.productsWithDetails];
              updatedProducts[i] = { 
                ...updatedProducts[i], 
                productDetails: productDetails?.data, 
                loading: false 
              };
              return { ...item, productsWithDetails: updatedProducts };
            }
            return item;
          })
        );
      } catch (error) {
        console.error(`Error fetching product ${products[i].productId}:`, error);
        
        setAnalysisHistory(prev => 
          prev.map(item => {
            if (item._id === analysisId && item.productsWithDetails) {
              const updatedProducts = [...item.productsWithDetails];
              updatedProducts[i] = { ...updatedProducts[i], loading: false };
              return { ...item, productsWithDetails: updatedProducts };
            }
            return item;
          })
        );
      }
    }

    // Set final loading state
    setAnalysisHistory(prev => 
      prev.map(item => 
        item._id === analysisId ? { ...item, productsLoading: false } : item
      )
    );
  };

  const toggleAnalysisExpanded = (analysisId: string) => {
    setAnalysisHistory(prev => 
      prev.map(item => {
        if (item._id === analysisId) {
          const newExpanded = !item.expanded;
          
          // If expanding and has products but not loaded yet, fetch them
          if (newExpanded && item.recommendedProducts.length > 0 && !item.productsWithDetails?.length) {
            fetchProductsForAnalysis(analysisId, item.recommendedProducts);
          }
          
          return { ...item, expanded: newExpanded };
        }
        return item;
      })
    );
  };

  const renderProductItem = ({ item }: { item: ProductWithDetails }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => {
        if (item.productDetails) {
          router.push(`/(tabs)/${item.productId}` as any);
        }
      }}
    >
      {item.loading ? (
        <View style={styles.productLoading}>
          <ActivityIndicator size="small" color="#1565C0" />
          <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.errorText}>Failed to load product</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAnalysisItem = ({ item }: { item: AnalysisWithProducts }) => (
    <View style={styles.analysisCard}>
      <TouchableOpacity 
        style={styles.analysisHeader}
        onPress={() => toggleAnalysisExpanded(item._id)}
      >
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.analysisImage}
          resizeMode="cover"
        />
        <View style={styles.analysisInfo}>
          <Text style={styles.skinType}>{item.skinType.toUpperCase()}</Text>
          <Text style={styles.analysisDate}>
            {new Date(item.analysisDate).toLocaleDateString()}
          </Text>
          <Text style={styles.productCount}>
            {item.recommendedProducts.length} products recommended
          </Text>
        </View>
        <Text style={styles.expandIcon}>
          {item.expanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {item.expanded && (
        <View style={styles.expandedContent}>
          {item.recommendedProducts.length > 0 ? (
            <>
              <Text style={styles.productsTitle}>Recommended Products</Text>
              {item.productsLoading ? (
                <View style={styles.productsLoading}>
                  <ActivityIndicator size="small" color="#1565C0" />
                  <Text style={styles.loadingText}>Loading products...</Text>
                </View>
              ) : (
                <FlatList
                  data={item.productsWithDetails}
                  keyExtractor={(product) => product._id}
                  renderItem={renderProductItem}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          ) : (
            <Text style={styles.noProductsText}>
              No product recommendations for this analysis
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1565C0" />
          </TouchableOpacity>
          <Text style={styles.title}>Analysis History</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Loading analysis history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1565C0" />
          </TouchableOpacity>
          <Text style={styles.title}>Analysis History</Text>
          <View style={styles.placeholder} />
        </View>

        {analysisHistory.length > 0 ? (
          <FlatList
            data={analysisHistory}
            keyExtractor={(item) => item._id}
            renderItem={renderAnalysisItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.centerContent}>
            <Ionicons name="analytics-outline" size={60} color="#1565C0" />
            <Text style={styles.noDataText}>No analysis history found</Text>
            <Text style={styles.noDataSubtext}>
              Start analyzing your skin to see your history here
            </Text>
            <TouchableOpacity 
              style={styles.analyzeButton} 
              onPress={() => router.push('/(tabs)/analyze')}
            >
              <Text style={styles.analyzeButtonText}>Start Analysis</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50, // Add top padding to account for status bar
    backgroundColor: '#1565C0', // Match header color
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF', // White text for better contrast
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1565C0',
  },
  listContainer: {
    padding: 20,
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    overflow: 'hidden',
  },
  analysisHeader: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  analysisImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  analysisInfo: {
    flex: 1,
  },
  skinType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 5,
  },
  analysisDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  productCount: {
    fontSize: 12,
    color: '#90CAF9',
  },
  expandIcon: {
    fontSize: 16,
    color: '#1565C0',
    marginLeft: 10,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
    padding: 15,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 10,
  },
  productsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  productCard: {
    backgroundColor: '#F8FAFE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 3,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 3,
  },
  recommendationReason: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  productCategory: {
    fontSize: 10,
    color: '#90CAF9',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  productLoading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  productError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
  },
  noProductsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  noDataText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#90CAF9',
    textAlign: 'center',
    marginBottom: 30,
  },
  analyzeButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
