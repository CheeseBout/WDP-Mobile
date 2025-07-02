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
import { Product as ProductAPI } from '../../services/product.service';

interface Product {
  id: string;
  productName: string;
  price: number;
  productImages: string[];
  productDescription: string;
  category: string[];
  brand: string;
  suitableFor: string;
  salePercentage: number;
  expiryDate: string;
  stock: number;
}

interface ProductWithDetails extends RecommendedProduct {
  productDetails?: ProductAPI;
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
    setAnalysisHistory(prev =>
      prev.map(item =>
        item._id === analysisId
          ? { ...item, productsLoading: true, productsWithDetails: products.map(p => ({ ...p, loading: true })) }
          : item
      )
    );

    for (let i = 0; i < products.length; i++) {
      try {
        const productDetails = await getProductById(products[i].productId);
        setAnalysisHistory(prev =>
          prev.map(item => {
            if (item._id === analysisId && item.productsWithDetails) {
              const updatedProducts = [...item.productsWithDetails];
              updatedProducts[i] = {
                ...updatedProducts[i],
                productDetails: productDetails?.data || productDetails,
                loading: false
              };
              return { ...item, productsWithDetails: updatedProducts };
            }
            return item;
          })
        );
      } catch (error) {
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
          if (newExpanded && item.recommendedProducts.length > 0 && !item.productsWithDetails?.length) {
            fetchProductsForAnalysis(analysisId, item.recommendedProducts);
          }
          return { ...item, expanded: newExpanded };
        }
        return item;
      })
    );
  };

  // Format price as in analyze.tsx
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscountedPrice = (price: number, salePercentage: number) => {
    return price - (price * salePercentage / 100);
  };

  const renderProductItem = ({ item }: { item: ProductWithDetails }) => {
    const details = item.productDetails as ProductAPI | undefined;
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          if (details) {
            router.push(`/(tabs)/${details.id}` as any);
          }
        }}
        activeOpacity={0.9}
      >
        {item.loading ? (
          <View style={styles.productLoading}>
            <ActivityIndicator size="small" color="#1565C0" />
            <Text style={styles.productLoadingText}>Loading...</Text>
          </View>
        ) : details ? (
          <>
            <View style={styles.productImageContainer}>
              <Image
                source={{ uri: details.productImages?.[0] || "" }}
                style={styles.productImage}
                resizeMode="cover"
                onError={() => {}}
              />
              {details.salePercentage > 0 && (
                <View style={styles.saleBadge}>
                  <Text style={styles.saleBadgeText}>-{details.salePercentage}%</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{details.productName}</Text>
              <Text style={styles.productBrand}>{details.brand}</Text>
              <View style={styles.priceRow}>
                {details.salePercentage > 0 ? (
                  <>
                    <Text style={styles.originalPrice}>{formatPrice(details.price)}</Text>
                    <Text style={styles.discountedPrice}>
                      {formatPrice(calculateDiscountedPrice(details.price, details.salePercentage))}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.price}>{formatPrice(details.price)}</Text>
                )}
              </View>
              <Text style={styles.recommendationReason}>{item.reason}</Text>
              <Text style={styles.productCategory}>
                {Array.isArray(details.category) ? details.category.join(", ") : details.category}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.productError}>
            <Text style={styles.errorText}>Failed to load product</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            {new Date(item.analysisDate).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })} {new Date(item.analysisDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.productCount}>
            {item.recommendedProducts.length} products recommended
          </Text>
        </View>
        <Text style={styles.expandIcon}>
          {item.expanded ? <Ionicons name="caret-down"/> : <Ionicons name="caret-forward"/>}
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
                  contentContainerStyle={styles.productsList}
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
            <Ionicons name="caret-back" size={24} color="#fff" />
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
            <Ionicons name="caret-back" size={24} color="#fff" />
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
    paddingVertical: 20,
    backgroundColor: '#1565C0',
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
    color: '#FFFFFF',
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
  productsList: {
    paddingBottom: 10,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  saleBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  saleBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  recommendationReason: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 10,
    color: '#90CAF9',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  productLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 20,
  },
  productLoadingText: {
    marginLeft: 8,
    color: '#1565C0',
    fontSize: 12,
  },
  productError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
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