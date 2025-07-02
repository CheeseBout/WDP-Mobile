import { Header } from '@/components/Header'
import { fetchAllProductsForAI, Product, searchProductsForAI } from '@/services/product.service'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState(q || '')
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(q || '')
  const router = useRouter()

  // Fetch all products and filter by search term
  const loadProducts = useCallback(async (search: string) => {
    setLoading(true)
    const res = await fetchAllProductsForAI()
    if (Array.isArray(res)) {
      setProducts(search ? searchProductsForAI(res, search) : res)
    } else {
      setProducts([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setSearchTerm(q || '')
    setAppliedSearchTerm(q || '')
    loadProducts(q || '')
  }, [q, loadProducts])

  const handleSearchChange = (text: string) => {
    setSearchTerm(text)
    if (text === '') {
      setAppliedSearchTerm('')
      loadProducts('')
    }
  }

  const handleSearchSubmit = () => {
    setAppliedSearchTerm(searchTerm)
    loadProducts(searchTerm)
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadProducts(appliedSearchTerm).then(() => setRefreshing(false))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const calculateDiscountedPrice = (price: number, salePercentage: number) => {
    return price - (price * salePercentage / 100)
  }

  const getStockColor = (stock: number) => {
    return stock > 10 ? '#4CAF50' : stock > 0 ? '#FF9800' : '#F44336'
  }

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/(tabs)/${item.id}` as any)}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: item.productImages?.[0] || '' }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
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
            onPress={e => {
              e.stopPropagation()
              router.push(`/(tabs)/${item.id}` as any)
            }}
          >
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Loading products...</Text>
          <Text style={styles.loadingSubtext}>Finding the best products for you</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>
          {appliedSearchTerm ? `Results for "${appliedSearchTerm}"` : 'All Products'}
        </Text>
      </View>
      <View style={styles.productsSection}>
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>Try adjusting your search</Text>
            </View>
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  headerSection: {
    padding: 20
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'left',
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
  productsSection: {
    flex: 1,
    paddingHorizontal: 10,
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
});