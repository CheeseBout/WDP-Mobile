import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { SignOutButton } from '../../components/SignOutButton'
import { User } from '../../services/auth.service'

export default function ProfileScreen() {
  const [user, setUser] = React.useState<User | null>(null)

  useFocusEffect(
    React.useCallback(() => {
      const loadUser = async () => {
        try {
          const userData = await AsyncStorage.getItem('user')
          if (userData) {
            setUser(JSON.parse(userData))
          }
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      }
      
      loadUser()
    }, [])
  )

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </Text>
            </View>
          </View>

          <Text style={styles.userName}>
            {user?.fullName || 'User'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email}
          </Text>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
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

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {user?.role || 'Customer'}
              </Text>
            </View>
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
})
