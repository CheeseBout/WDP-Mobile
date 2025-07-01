import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../../components/Header';
import { Category, fetchCategories, fetchProducts, Product } from '../../services/product.service';

const PAGE_SIZE = 20;

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const router = useRouter();

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await fetchCategories();
      if ('error' in result) {
        console.error('Error loading categories:', result.error);
      } else {
        setCategories(result.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async ({
    reset = false,
    nextPage = 1,
    searchQuery = appliedSearchTerm,
    categoryId = selectedCategoryId,
  }: {
    reset?: boolean;
    nextPage?: number;
    searchQuery?: string;
    categoryId?: string;
  } = {}) => {
    if (reset) setLoading(true);
    try {
      const result = await fetchProducts({
        page: nextPage,
        limit: PAGE_SIZE,
        sortBy: 'createdAt',
        order: 'desc',
        ...(searchQuery && { search: searchQuery }),
        ...(categoryId && { category: categoryId }),
      });

      if ('error' in result) {
        Alert.alert('Error', result.error);
      } else {
        // API response: { data: { products, total }, ... }
        const fetchedProducts = result.data.products;
        const fetchedTotal = result.data.total;
        setTotal(fetchedTotal);

        if (reset || nextPage === 1) {
          setProducts(fetchedProducts);
        } else {
          setProducts(prev => [...prev, ...fetchedProducts]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsFetchingMore(false);
    }
  };

  // Initial load and when filters/search change
  useEffect(() => {
    setPage(1);
    loadProducts({ reset: true, nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, appliedSearchTerm]);

  const handleSearch = () => {
    setLoading(true);
    setAppliedSearchTerm(searchTerm);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadProducts({ reset: true, nextPage: 1 });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    if (text === '') {
      setAppliedSearchTerm('');
    }
  };

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

  const getCategoryDisplayName = (category: Category) => {
    return category.categoryName;
  };

  const getStockColor = (stock: number) => {
    return stock > 10 ? '#4CAF50' : stock > 0 ? '#FF9800' : '#F44336';
  };

  const handleEndReached = useCallback(() => {
    if (isFetchingMore || loading) return;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (page < totalPages) {
      setIsFetchingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadProducts({
        nextPage,
        searchQuery: appliedSearchTerm,
        categoryId: selectedCategoryId,
      });
    }
  }, [isFetchingMore, loading, page, total, appliedSearchTerm, selectedCategoryId]);

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/(tabs)/${item.id}` as any)}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: item.productImages[0] }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => console.error('Failed to load product image')}
        />

        {item.salePercentage > 0 && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>-{item.salePercentage}%</Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>

        <View style={styles.priceContainer}>
          {item.salePercentage > 0 ? (
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>{formatPrice(item.price)}</Text>
              <Text style={styles.discountedPrice}>
                {formatPrice(calculateDiscountedPrice(item.price, item.salePercentage))}
              </Text>
            </View>
          ) : (
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.stockText, { color: getStockColor(item.stock) }]}>
            {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>

          <TouchableOpacity
            style={[styles.viewDetailsButton, item.stock === 0 && styles.viewDetailsButtonDisabled]}
            activeOpacity={0.8}
            disabled={item.stock === 0}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/(tabs)/${item.id}` as any);
            }}
          >
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Loading products...</Text>
          <Text style={styles.loadingSubtext}>Finding the best health products for you</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearch}
      />

      {/* Category Chips */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategoryId === '' && styles.categoryPillActive
            ]}
            onPress={() => handleCategorySelect('')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.categoryPillText,
              selectedCategoryId === '' && styles.categoryPillTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.categoryPill,
                selectedCategoryId === category._id && styles.categoryPillActive
              ]}
              onPress={() => handleCategorySelect(category._id)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.categoryPillText,
                selectedCategoryId === category._id && styles.categoryPillTextActive
              ]}>
                {getCategoryDisplayName(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.productsSection}>
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            isFetchingMore && products.length < total ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#1565C0" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
              <TouchableOpacity style={styles.resetButton} onPress={() => {
                setSearchTerm('');
                setAppliedSearchTerm('');
                setSelectedCategoryId('');
                setPage(1);
                loadProducts({ reset: true, nextPage: 1 });
              }}>
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFE',
    paddingHorizontal: 40,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 15,
    color: '#1565C0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingSubtext: {
    marginTop: 5,
    color: '#90CAF9',
    fontSize: 14,
    textAlign: 'center',
  },
  categorySection: {
    paddingVertical: 25,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryPill: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillActive: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    textTransform: 'capitalize',
  },
  categoryPillTextActive: {
    color: 'white',
  },
  productsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productList: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 4,
    flex: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    height: 140,
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saleBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productBrand: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceContainer: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
  },
  viewDetailsButton: {
    backgroundColor: '#1565C0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  viewDetailsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#90CAF9',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#1565C0',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
  }});