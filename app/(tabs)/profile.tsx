import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SignOutButton } from '../../components/SignOutButton'

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

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      const userData = await AsyncStorage.getItem('user')
      console.log('Raw user data from AsyncStorage:', userData)
      
      if (userData) {
        const parsedUser = JSON.parse(userData)
        console.log('Parsed user data:', parsedUser)
        setUser(parsedUser)
      } else {
        console.log('No user data found in AsyncStorage')
        setUser(null)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadUser()
    setRefreshing(false)
  }, [loadUser])

  useFocusEffect(
    useCallback(() => {
      loadUser()
    }, [loadUser])
  )

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No user data found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUser}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          </View>

          <Text style={styles.userName}>
            {user?.fullName || 'User'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'No email'}
          </Text>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date of birth</Text>
              <Text style={styles.infoValue}>
                {user?.dob ? user?.dob : 'Not provided yet'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>
                {user?.phone || 'Not provided'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {user?.address || 'Not provided'}
              </Text>
            </View>

            <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push('/(stack)/edit-profile')}>
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem} onPress={() => router.push('/(stack)/order')}>
              <Text style={styles.infoLabel}>Orders history</Text>
              <Text style={styles.infoValue}>
                <Ionicons name="caret-forward" size={16} color="#1565C0" />
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem} onPress={() => router.push('/(stack)/analysis')}>
              <Text style={styles.infoLabel}>Analysis history</Text>
              <Text style={styles.infoValue}>
                <Ionicons name="caret-forward" size={16} color="#1565C0" />
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsSection}>
            <SignOutButton />
          </View>
        </View>
      </ScrollView>
    </View>
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
  profileContainer: {
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
    marginTop: 60,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#90CAF9',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
    paddingBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    alignItems: 'center',
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
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editProfileButton: {
    backgroundColor: '#1565C0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 15,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
