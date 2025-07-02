import { Header } from '@/components/Header'
import { getStoredToken } from '@/services/auth.service'
import { addToCart, CartItemWithProduct, checkout, getMyCart, removeFromCart, storeSelectedItems, UserCart } from '@/services/cart.service'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function CartScreen() {
  const [searchTerm, setSearchTerm] = useState('')
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [cartData, setCartData] = useState<UserCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [quantityLoading, setQuantityLoading] = useState<string | null>(null) // productId for which quantity is updating

  useEffect(() => {
    loadCart()
  }, [])

  // Refresh cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCart()
    }, [])
  )

  const loadCart = async () => {
    try {
      setLoading(true)
      const token = await getStoredToken()
      if (!token) {
        console.log('No token found for cart request')
        setLoading(false)
        return
      }

      console.log('Loading cart...')
      const result = await getMyCart()
      if ('error' in result) {
        console.error('Error loading cart:', result.error)
        Alert.alert('Error', 'Failed to load cart. Please try again.')
        setCartItems([])
        setCartData(null)
        setTotalAmount(0)
        setSelectedProductIds([])
      } else {
        console.log('Cart loaded successfully:', result.data.items.length, 'items')
        setCartItems(result.data.items)
        setCartData(result.data)
        setTotalAmount(result.data.totalAmount)
        // Automatically select all items
        setSelectedProductIds(result.data.items.map(item => item.productId._id))
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      Alert.alert('Error', 'Failed to load cart. Please check your connection.')
      setCartItems([])
      setCartData(null)
      setTotalAmount(0)
      setSelectedProductIds([])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleRemoveItem = async (productId: string) => {
    try {
      const result = await removeFromCart(productId)
      if (result.success) {
        Alert.alert('Success', 'Item removed from cart')
        // Remove from selected items if it was selected
        setSelectedProductIds(prev => prev.filter(id => id !== productId))
        loadCart() // Reload cart
      } else {
        Alert.alert('Error', result.message)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item')
    }
  }

  const handleItemSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        // Remove from selection
        return prev.filter(id => id !== productId)
      } else {
        // Add to selection
        return [...prev, productId]
      }
    })
  }

  const calculateSelectedTotal = () => {
    return cartItems
      .filter(item => selectedProductIds.includes(item.productId._id))
      .reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Add/Remove quantity logic using addToCart and removeFromCart
  const handleIncreaseQuantity = async (item: CartItemWithProduct) => {
    setQuantityLoading(item.productId._id)
    try {
      // Call addToCart with quantity 1 to increase
      const result = await addToCart({
        productId: item.productId._id,
        quantity: 1,
      })
      if (result.success) {
        loadCart()
      } else {
        Alert.alert('Error', result.message || 'Failed to increase quantity')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to increase quantity')
    } finally {
      setQuantityLoading(null)
    }
  }

  const handleDecreaseQuantity = async (item: CartItemWithProduct) => {
    if (item.quantity <= 1) {
      // Remove item from cart if quantity is 1
      handleRemoveItem(item.productId._id)
      return
    }
    setQuantityLoading(item.productId._id)
    try {
      // Remove one unit by calling removeFromCart and then add back (n-1) units
      // But since removeFromCart removes all, we need to re-add (quantity-1)
      await removeFromCart(item.productId._id)
      const result = await addToCart({
        productId: item.productId._id,
        quantity: item.quantity - 1,
      })
      if (result.success) {
        loadCart()
      } else {
        Alert.alert('Error', result.message || 'Failed to decrease quantity')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decrease quantity')
    } finally {
      setQuantityLoading(null)
    }
  }

  const handleCheckout = async () => {
    if (selectedProductIds.length === 0) {
      Alert.alert('Error', 'Please select at least one item to checkout')
      return
    }

    if (!cartData) {
      Alert.alert('Error', 'Cart data not available')
      return
    }

    setCheckoutLoading(true)
    try {
      // Store selected product IDs in AsyncStorage
      await storeSelectedItems(selectedProductIds);

      // Filter selected items from cart
      const selectedItems = cartItems.filter(item => 
        selectedProductIds.includes(item.productId._id)
      );

      // Calculate total for selected items
      const selectedTotal = selectedItems.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );

      // Build cart object for checkout - use the actual cart ID and user ID from cart data
      const checkoutPayload = {
        cart: {
          _id: cartData._id,
          userId: cartData.userId,
          items: selectedItems.map(item => ({
            productId: item.productId._id,
            price: item.price,
            quantity: item.quantity
          })),
          totalPrice: selectedTotal
        },
        bankCode: "NCB",
        language: "vn"
      };

      console.log('Sending checkout payload:', checkoutPayload);

      const result = await checkout(checkoutPayload);
      if (result.success && result.paymentUrl) {
        console.log('Payment URL received:', result.paymentUrl);
        
        // Navigate to payment screen with payment data
        router.push({
          pathname: '/(stack)/payment',
          params: {
            paymentUrl: result.paymentUrl,
            orderReference: result.orderReference || '',
            totalAmount: (result.totalAmount || selectedTotal).toString()
          }
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to create payment session')
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Failed to proceed to checkout')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const renderCartItem = ({ item }: { item: CartItemWithProduct }) => {
    const isSelected = selectedProductIds.includes(item.productId._id)
    const isQtyLoading = quantityLoading === item.productId._id

    return (
      <TouchableOpacity 
        style={[styles.cartItem, isSelected && styles.cartItemSelected]}
        onPress={() => handleItemSelection(item.productId._id)}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </View>
        
        <View style={styles.productImagePlaceholder}>
          <Image 
            source={{ uri: item.productId.productImages[0] }}
            style={styles.cartImage}
            resizeMode="cover"/>
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemBrand}>{item.productId.brand}</Text>
          <Text style={styles.itemName} numberOfLines={2}>{item.productId.productName}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            {/* Quantity controls */}
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.qtyButton, item.quantity <= 1 && styles.qtyButtonDisabled]}
                onPress={() => handleDecreaseQuantity(item)}
                disabled={isQtyLoading}
              >
                <Ionicons name="remove" size={16} color={item.quantity <= 1 ? "#ccc" : "#1565C0"} />
              </TouchableOpacity>
              <View style={styles.qtyValueBox}>
                {isQtyLoading ? (
                  <ActivityIndicator size="small" color="#1565C0" />
                ) : (
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleIncreaseQuantity(item)}
                disabled={isQtyLoading}
              >
                <Ionicons name="add" size={16} color="#1565C0" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.productId._id)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          showSearch={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={60} color="#1565C0" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some products to get started</Text>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <View style={styles.selectionHeader}>
            <TouchableOpacity 
              style={styles.selectAllButton}
              onPress={() => {
                if (selectedProductIds.length === cartItems.length) {
                  // Deselect all
                  setSelectedProductIds([])
                } else {
                  // Select all
                  setSelectedProductIds(cartItems.map(item => item.productId._id))
                }
              }}
            >
              <View style={[styles.checkbox, selectedProductIds.length === cartItems.length && styles.checkboxSelected]}>
                {selectedProductIds.length === cartItems.length && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.selectAllText}>
                {selectedProductIds.length === cartItems.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.selectedCount}>
              {selectedProductIds.length} of {cartItems.length} selected
            </Text>
          </View>

          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item._id}
            style={styles.cartList}
            contentContainerStyle={styles.cartListContent}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total ({selectedProductIds.length} items)</Text>
              <Text style={styles.totalAmount}>{formatPrice(calculateSelectedTotal())}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.checkoutButton, (selectedProductIds.length === 0 || checkoutLoading) && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={selectedProductIds.length === 0 || checkoutLoading}
            >
              {checkoutLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.checkoutIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  contentWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#1565C0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1565C0',
    marginTop: 18,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cartImage: {
    width: 75,
    height: 75,
    borderRadius: 10,
  },
  cartItemSelected: {
    borderColor: '#1565C0',
    borderWidth: 2,
    backgroundColor: '#F8FAFE',
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemDetails: {
    flex: 1,
  },
  itemBrand: {
    fontSize: 10,
    color: '#1565C0',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 15,
    color: '#FF4444',
    fontWeight: '600',
  },
  // Quantity controls styles
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#E3ECF7',
    marginHorizontal: 2,
  },
  qtyButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  qtyValueBox: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    marginLeft: 8,
  },
  totalSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.select({
      ios: 40,
      android: 20,
      default: 20,
    }),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1565C0',
  },
  checkoutButton: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  checkoutIcon: {
    marginLeft: 4,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#1565C0',
  },
  selectedCount: {
    fontSize: 12,
    color: '#666',
  },
})