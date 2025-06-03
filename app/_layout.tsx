import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Slot } from 'expo-router'
import { StyleSheet } from 'react-native'

export default function RootLayout() {
  return (
    // <SafeAreaView style={styles.container} >
      <ClerkProvider tokenCache={tokenCache} >
        <Slot />
      </ClerkProvider>
    // </SafeAreaView >
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 45,
    backgroundColor: '#000',
  },
})