import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface HeaderProps {
    showSearch?: boolean;
    searchTerm?: string;
    onSearchChange?: (text: string) => void;
    onSearchSubmit?: () => void;
    showCartIcon?: boolean;
    showNotificationIcon?: boolean;
    cartCount?: number;
    notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
    showSearch = false,
    searchTerm = '',
    onSearchChange,
    onSearchSubmit,
    showCartIcon = true,
    showNotificationIcon = true,
    cartCount = 0,
    notificationCount = 0,
}) => {
    const router = useRouter();

    return (
        <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
                {showSearch && (
                    <View style={styles.searchContainer}>
                        <TouchableOpacity onPress={onSearchSubmit}>
                            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.searchIcon} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products..."
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={searchTerm}
                            onChangeText={onSearchChange}
                            onSubmitEditing={onSearchSubmit}
                        />
                        {searchTerm.length > 0 && (
                            <TouchableOpacity onPress={() => onSearchChange?.('')} style={styles.clearButton}>
                                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.headerIcons}>
                    {showCartIcon && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            activeOpacity={0.8}
                            onPress={() => router.push('/(tabs)/cart')}
                        >
                            <Ionicons name="cart-outline" size={24} color="white" />
                            {cartCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{cartCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {showNotificationIcon && (
                        <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
                            <Ionicons name="notifications-outline" size={24} color="white" />
                            {notificationCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{notificationCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#1565C0',
        paddingTop: 30,
        paddingBottom: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 15,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        position: 'relative',
        padding: 6,
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#FF4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: 'white',
    },
    clearButton: {
        padding: 2,
    },
});
