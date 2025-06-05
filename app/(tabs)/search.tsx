import { fetchAllProductsForAI, Product, searchProductsForAI } from '@/services/product.service'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native'

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchAllProductsForAI().then(res => {
      if (!mounted) return
      if (Array.isArray(res)) {
        setProducts(q ? searchProductsForAI(res, q) : res)
      } else {
        setProducts([])
      }
      setLoading(false)
    })
    return () => { mounted = false }
  }, [q])

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#1565C0" />
      ) : (
        <>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            {q ? `Results for "${q}"` : 'All Products'}
          </Text>
          {products.length === 0 ? (
            <Text>No products found.</Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee',
                  }}
                  onPress={() => router.push(`/product/${item.id}`)}
                >
                  <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.productName}</Text>
                  <Text style={{ fontSize: 13, color: '#888' }}>{item.brand}</Text>
                  <Text style={{ fontSize: 13, color: '#888' }}>{item.price}₫</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}
    </View>
  )
}