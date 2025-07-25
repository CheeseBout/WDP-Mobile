import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Slot } from 'expo-router'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CartProvider } from './context/CartContext'

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <CartProvider>
        <ClerkProvider tokenCache={tokenCache} >
          <Slot />
        </ClerkProvider>
      </CartProvider>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
})