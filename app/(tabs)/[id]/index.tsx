import { getStoredToken } from '@/services/auth.service'
import { addToCart } from '@/services/cart.service'
import { fetchProductById, Product } from '@/services/product.service'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      if (typeof id === 'string') {
        setLoading(true)
        const result = await fetchProductById(id)
        
        if ('error' in result) {
          setError(result.error)
        } else {
          setProduct(result)
        }
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

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

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;

    setAddingToCart(true);
    try {
      // Check if we have a valid token
      const token = await getStoredToken();
      
      if (!token) {
        Alert.alert('Error', 'Please log in to add items to cart');
        return;
      }

      console.log('Token available for cart request');

      const result = await addToCart({
        productId: product.id,
        quantity: quantity
      });

      if (result.success) {
        Alert.alert('Success', 'Product added to cart successfully!');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', 'Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    )
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1565C0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#1565C0" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#1565C0" />
            <Text style={styles.imagePlaceholder}>
              {product.productImages[0] || 'Product Image'}
            </Text>
          </View>
          {product.salePercentage > 0 && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>-{product.salePercentage}%</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <View style={styles.brandSection}>
            <Text style={styles.brand}>{product.brand}</Text>
            {product.averageRating > 0 && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{product.averageRating}</Text>
              </View>
            )}
          </View
          >
          <Text style={styles.productName}>{product.productName}</Text>
          
          <View style={styles.priceSection}>
            {product.salePercentage > 0 ? (
              <View style={styles.priceRow}>
                <Text style={styles.discountedPrice}>
                  {formatPrice(calculateDiscountedPrice(product.price, product.salePercentage))}
                </Text>
                <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
              </View>
            ) : (
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
            )}
            
            <View style={styles.stockBadge}>
              <View style={[styles.stockIndicator, { backgroundColor: product.stock > 0 ? '#4CAF50' : '#FF3B30' }]} />
              <Text style={styles.stockText}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.productDescription}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Key Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Suitable For:</Text>
              <Text style={styles.infoValue}>{product.suitableFor}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expiry Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(product.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.ingredients}>{product.ingredients}</Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomSection}>
        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove" size={20} color={quantity <= 1 ? "#ccc" : "#1565C0"} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={[styles.quantityButton, quantity >= (product?.stock || 0) && styles.quantityButtonDisabled]}
              onPress={increaseQuantity}
              disabled={quantity >= (product?.stock || 0)}
            >
              <Ionicons name="add" size={20} color={quantity >= (product?.stock || 0) ? "#ccc" : "#1565C0"} />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.addToCartButton, (product?.stock === 0 || addingToCart) && styles.addToCartButtonDisabled]}
          disabled={product?.stock === 0 || addingToCart}
          onPress={handleAddToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size={20} color="#fff" />
          ) : (
            <Ionicons name="cart" size={20} color="#fff" />
          )}
          <Text style={styles.buttonText}>
            {addingToCart ? 'Adding...' : product?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565C0',
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 280,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    fontSize: 14,
    color: '#1565C0',
    marginTop: 8,
    fontWeight: '500',
  },
  saleBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF4444',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  brandSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 12,
    marginLeft: 4,
    color: '#F57C00',
    fontWeight: '600',
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 28,
  },
  priceSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    color: '#1565C0',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  discountedPrice: {
    fontSize: 24,
    color: '#FF4444',
    fontWeight: 'bold',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  ingredients: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFE',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#1565C0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
})
