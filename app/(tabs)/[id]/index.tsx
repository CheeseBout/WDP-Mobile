import { useCart } from '@/app/context/CartContext'
import { getStoredToken } from '@/services/auth.service'
import { addToCart } from '@/services/cart.service'
import { createProductReview, fetchProductById, fetchProductReviews, Product, Review } from '@/services/product.service'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const {refreshCart} = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      if (typeof id === 'string') {
        setLoading(true)
        const result = await fetchProductById(id)

        if ('error' in result) {
          setError(result.error)
        } else {
          setProduct(result)
          // Load reviews after product is loaded
          loadReviews(id)
        }
        setLoading(false)
      }
    }

    const loadCurrentUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          setCurrentUserId(user.id)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadProduct()
    loadCurrentUser()
  }, [id])

  const loadReviews = async (productId: string) => {
    setReviewsLoading(true)
    try {
      const result = await fetchProductReviews(productId)
      if ('error' in result) {
        console.error('Error loading reviews:', result.error)
        setReviews([])
      } else {
        setReviews(result.data)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
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

  const formatReviewDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderStars = (rating: number) => {
    return renderRatingStars(rating)
  }

  const renderRatingStars = (currentRating: number, onRatingPress?: (rating: number) => void) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => onRatingPress && onRatingPress(i)}
          disabled={!onRatingPress}
        >
          <Ionicons
            name={i <= currentRating ? 'star' : 'star-outline'}
            size={onRatingPress ? 24 : 16}
            color={i <= currentRating ? '#FFD700' : '#ccc'}
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      )
    }
    return <View style={styles.starsContainer}>{stars}</View>
  }

  const renderReviewItem = (review: Review) => (
    <View key={review._id} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {review.userId.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.reviewUserName}>{review.userId.fullName}</Text>
            <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(review.rating)}
        </View>
      </View>
      <Text style={styles.reviewContent}>{review.content}</Text>
    </View>
  )

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
        await refreshCart();
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

  const submitReview = async () => {
    if (!currentUserId || !product) {
      Alert.alert('Error', 'Please log in to submit a review')
      return
    }

    if (!reviewContent.trim()) {
      Alert.alert('Error', 'Please enter your review content')
      return
    }

    setSubmittingReview(true)
    try {
      const reviewData = {
        productId: product.id,
        userId: currentUserId,
        rating: reviewRating,
        content: reviewContent.trim()
      }

      const result = await createProductReview(reviewData)

      if ('error' in result) {
        Alert.alert('Error', result.error)
      } else {
        Alert.alert('Success', 'Review submitted successfully!')
        setShowReviewModal(false)
        setReviewContent('')
        setReviewRating(5)
        // Reload reviews to show the new one
        loadReviews(product.id)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      Alert.alert('Error', 'Failed to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

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
          <Ionicons name="caret-back" size={24} color="#fff" />
        </TouchableOpacity>
        
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <View style={styles.productImage}>
            {/* <Ionicons name="image-outline" size={60} color="#ccc" /> */}
            <Image
              source={{ uri: product.productImages[0] }}
              style={{ width: '100%', height: '100%', borderRadius: 15 }}
              resizeMode="cover" />
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

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.reviewActions}>
                {reviewsLoading ? (
                  <ActivityIndicator size="small" color="#1565C0" />
                ) : (
                  <Text style={styles.reviewsCount}>({reviews.length})</Text>
                )}
                {currentUserId && (
                  <TouchableOpacity
                    style={styles.addReviewButton}
                    onPress={() => setShowReviewModal(true)}
                  >
                    <Ionicons name="add" size={16} color="white" />
                    <Text style={styles.addReviewButtonText}>Add Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {reviewsLoading ? (
              <View style={styles.reviewsLoading}>
                <ActivityIndicator size="large" color="#1565C0" />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map(renderReviewItem)}
              </View>
            ) : (
              <View style={styles.noReviews}>
                <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>Be the first to review this product</Text>
              </View>
            )}
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

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Rating</Text>
              {renderRatingStars(reviewRating, setReviewRating)}
            </View>

            <View style={styles.contentSection}>
              <Text style={styles.contentLabel}>Your Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with this product..."
                multiline
                numberOfLines={4}
                value={reviewContent}
                onChangeText={setReviewContent}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submittingReview && styles.submitButtonDisabled]}
                onPress={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 10,
    backgroundColor: '#1565C0',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1565C0',
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
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 10,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addReviewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewsLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  reviewsList: {
    marginTop: 10,
  },
  reviewItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    marginLeft: 10,
  },
  reviewContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginTop: 10,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  contentSection: {
    marginBottom: 30,
  },
  contentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#f8f8f8',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
