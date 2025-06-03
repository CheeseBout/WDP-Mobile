import AsyncStorage from '@react-native-async-storage/async-storage'
import { Stack, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
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
import { getStoredToken, updateUserProfile } from '../../services/auth.service'

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  dob: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EditProfileScreen() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      const userData = await AsyncStorage.getItem('user')
      
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Initialize form with current data
        setFullName(parsedUser.fullName || '')
        setPhone(parsedUser.phone || '')
        setAddress(parsedUser.address || '')
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      Alert.alert('Error', 'Failed to load user data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not available')
      return
    }

    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required')
      return
    }

    setSaving(true)
    try {
      const token = await getStoredToken()
      if (!token) {
        Alert.alert('Error', 'Authentication token not found')
        return
      }

      const updateData = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      }

      const result = await updateUserProfile(user.id, updateData, token)

      if ('error' in result) {
        Alert.alert('Error', result.error)
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ])
      }
    } catch (error) {
      console.error('Save error:', error)
      Alert.alert('Error', 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: 'white',
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Edit Your Profile</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#8B9DC3"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.email || ''}
                editable={false}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#8B9DC3"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your address"
                placeholderTextColor="#8B9DC3"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Role</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                editable={false}
              />
              <Text style={styles.helperText}>Role can only be changed by admin</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => router.back()}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1565C0',
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
    marginTop: 20,
  },
  title: {
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
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  textArea: {
    height: 80,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1565C0',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})
