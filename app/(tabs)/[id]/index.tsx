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
        <ActivityIndicator size="large" color="#1565C0" />
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
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="heart-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <View style={styles.productImage}>
            <Ionicons name="image-outline" size={60} color="#ccc" />
          </View>
          {product.salePercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{product.salePercentage}%</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.productName}>{product.productName}</Text>
          
          <View style={styles.priceRow}>
            {product.salePercentage > 0 ? (
              <View style={styles.priceContainer}>
                <Text style={styles.salePrice}>
                  {formatPrice(calculateDiscountedPrice(product.price, product.salePercentage))}
                </Text>
                <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
              </View>
            ) : (
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
            )}
            
            <View style={styles.stockContainer}>
              <Text style={[styles.stockText, { color: product.stock > 0 ? '#4CAF50' : '#F44336' }]}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.productDescription}</Text>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Suitable For:</Text>
              <Text style={styles.detailValue}>{product.suitableFor}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(product.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.description}>{product.ingredients}</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={[styles.quantityBtn, quantity <= 1 && styles.quantityBtnDisabled]}
            onPress={decreaseQuantity}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={16} color={quantity <= 1 ? "#ccc" : "#666"} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity 
            style={[styles.quantityBtn, quantity >= product.stock && styles.quantityBtnDisabled]}
            onPress={increaseQuantity}
            disabled={quantity >= product.stock}
          >
            <Ionicons name="add" size={16} color={quantity >= product.stock ? "#ccc" : "#666"} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.addToCartBtn, (product.stock === 0 || addingToCart) && styles.addToCartBtnDisabled]}
          disabled={product.stock === 0 || addingToCart}
          onPress={handleAddToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size={20} color="#fff" />
          ) : (
            <Text style={styles.addToCartText}>
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    backgroundColor: '#f8f8f8',
    margin: 20,
    borderRadius: 15,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  discountBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FF4444',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  brand: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 5,
  },
  productName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    lineHeight: 30,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 22,
    color: '#1565C0',
    fontWeight: '700',
  },
  salePrice: {
    fontSize: 22,
    color: '#FF4444',
    fontWeight: '700',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginRight: 15,
  },
  quantityBtn: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnDisabled: {
    opacity: 0.5,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 15,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartBtnDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  backButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
