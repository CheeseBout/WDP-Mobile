import { useOAuth, useSignIn } from '@clerk/clerk-expo'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Link, Stack, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'

// Warm up the browser to improve UX
WebBrowser.maybeCompleteAuthSession()

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)

  // Handle Google OAuth sign-in
  const onGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const { createdSessionId, setActive: setActiveSession } = await startOAuthFlow()

      if (createdSessionId) {
        setActiveSession({ session: createdSessionId })
        router.replace('/(tabs)')
      }
    } catch (err) {
      console.error('OAuth error', err)
      Alert.alert('Error', 'Google login failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    if (!emailAddress || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    setLoading(true)
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/(tabs)')
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
        Alert.alert('Error', 'Sign in failed')
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      Alert.alert('Error', 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Stack.Screen
      options={{
        title: 'Sign In',
      }} />
        <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#8B9DC3"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#8B9DC3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={onSignInPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={onGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1565C0" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="black" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink}>
            <Link href={"/sign-up" as any}>
              <Text style={styles.registerLinkText}>
                New patient? <Text style={styles.registerLinkBold}>Create Account</Text>
              </Text>
            </Link>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
      </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginTop: 80,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FBFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    color: '#1565C0',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#42A5F5',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#1565C0',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3F2FD',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#90CAF9',
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#F8FBFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E3F2FD',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#1565C0',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  registerLinkText: {
    color: '#90CAF9',
    fontSize: 14,
  },
  registerLinkBold: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
})