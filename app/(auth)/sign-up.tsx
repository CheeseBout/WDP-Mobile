import { useOAuth, useSignUp } from '@clerk/clerk-expo'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Link, Stack, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as React from 'react'
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

WebBrowser.maybeCompleteAuthSession()

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)

  const onGoogleSignUp = async () => {
    setGoogleLoading(true)
    try {
      const { createdSessionId, setActive } = await startOAuthFlow()

      if (createdSessionId) {
        setActive({ session: createdSessionId })
        router.replace('/')
      }
    } catch (err) {
      console.error('OAuth error', err)
      Alert.alert('Error', 'Google sign up failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    if (!emailAddress || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      Alert.alert('Error', 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    if (!code) {
      Alert.alert('Error', 'Please enter the verification code')
      return
    }

    setLoading(true)
    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
        Alert.alert('Error', 'Verification failed')
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      Alert.alert('Error', 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Verify Your Email</Text>
            <Text style={styles.verificationSubtext}>
              We've sent a verification code to {emailAddress}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter verification code"
                placeholderTextColor="#8B9DC3"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                textAlign="center"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={onVerifyPress}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Verify Email</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <><Stack.Screen
      options={{
        title: 'Sign Up',
      }} />
      <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Create Account</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#8B9DC3"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
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
              placeholder="Create a password (min 6 characters)"
              placeholderTextColor="#8B9DC3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={onSignUpPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={onGoogleSignUp}
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
            <Link href={"/sign-in" as any}>
              <Text style={styles.registerLinkText}>
                Already have an account? <Text style={styles.registerLinkBold}>Sign in</Text>
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
  verificationSubtext: {
    fontSize: 14,
    color: '#90CAF9',
    textAlign: 'center',
    marginBottom: 25,
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
