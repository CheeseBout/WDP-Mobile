import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Header } from '../../components/Header';
import { fetchProducts, Product } from '../../services/product.service';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const router = useRouter()

  const categories = ['All', 'skincare', 'supplements', 'vitamins', 'moisturizer', 'serum'];

  const loadProducts = async (searchQuery: string = appliedSearchTerm) => {
    try {
      const result = await fetchProducts({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc',
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory && selectedCategory !== 'All' && { category: selectedCategory })
      });

      if ('error' in result) {
        Alert.alert('Error', result.error);
      } else {
        setProducts(result.data.products);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts(appliedSearchTerm);
  }, [selectedCategory, appliedSearchTerm]);

  const handleSearch = () => {
    setLoading(true);
    setAppliedSearchTerm(searchTerm);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(appliedSearchTerm);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    // Clear applied search when input is cleared
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

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/product/${item.id}` as any)}
    >
      <View style={styles.productImageContainer}>
        <View style={styles.productImagePlaceholder} />
        
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
            style={[styles.addButton, item.stock === 0 && styles.addButtonDisabled]} 
            activeOpacity={0.8}
            disabled={item.stock === 0}
          >
            <Text style={styles.addButtonText}>+</Text>
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
        cartCount={2}
        notificationCount={3}
      />

      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryPill,
                selectedCategory === category && styles.categoryPillActive
              ]}
              onPress={() => handleCategorySelect(category)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.categoryPillText,
                selectedCategory === category && styles.categoryPillTextActive
              ]}>
                {category === 'All' ? '🏠 All' : `${getCategoryIcon(category)} ${category}`}
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
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
              <TouchableOpacity style={styles.resetButton} onPress={() => {
                setSearchTerm('');
                setAppliedSearchTerm('');
                setSelectedCategory('All');
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

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'skincare': return '🧴';
    case 'supplements': return '💊';
    case 'vitamins': return '🔬';
    case 'moisturizer': return '💧';
    case 'serum': return '✨';
    default: return '📦';
  }
};

const getStockColor = (stock: number) => {
  return stock > 10 ? '#4CAF50' : stock > 0 ? '#FF9800' : '#F44336';
};

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
  addButton: {
    backgroundColor: '#1565C0',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
});
