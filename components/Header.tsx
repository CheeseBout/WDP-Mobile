import { fetchAllProductsForAI, Product, searchProductsForAI } from '@/services/product.service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Keyboard,
    Pressable,
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
    showNotificationIcon?: boolean;
    notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
    showSearch = false,
    searchTerm = '',
    onSearchChange,
    onSearchSubmit,
    showNotificationIcon = true,
    notificationCount = 0,
}) => {
    const router = useRouter();
    const navigation = useNavigation();

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // Load all products once
    useEffect(() => {
        let mounted = true;
        fetchAllProductsForAI().then(res => {
            if (mounted && Array.isArray(res)) setAllProducts(res);
        });
        return () => { mounted = false; };
    }, []);

    // Filter products as user types
    useEffect(() => {
        if (showSearch && localSearchTerm.trim().length > 0) {
            const filtered = searchProductsForAI(allProducts, localSearchTerm.trim()).slice(0, 5);
            setFilteredProducts(filtered);
            setShowDropdown(filtered.length > 0 && isInputFocused);
        } else {
            setFilteredProducts([]);
            setShowDropdown(false);
        }
    }, [localSearchTerm, allProducts, showSearch, isInputFocused]);

    // Handle search input change
    const handleSearchChange = (text: string) => {
        setLocalSearchTerm(text);
        onSearchChange?.(text);
    };

    // Handle search submit (button or enter)
    const handleSearchSubmit = () => {
        Keyboard.dismiss();
        setShowDropdown(false);
        setIsInputFocused(false);
        // Always navigate to search screen, with or without query
        router.push({ pathname: '/(tabs)/search', params: localSearchTerm.trim().length > 0 ? { q: localSearchTerm.trim() } : {} });
        onSearchSubmit?.();
    };

    // Handle dropdown item press
    const handleProductPress = (productId: string) => {
        setShowDropdown(false);
        setIsInputFocused(false);
        Keyboard.dismiss();
        router.push(`/product/${productId}`);
    };

    // Hide dropdown when user taps outside
    useEffect(() => {
        if (!isInputFocused) {
            setShowDropdown(false);
        }
    }, [isInputFocused]);

    return (
        <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
                {showSearch && (
                    <View style={{ flex: 1, position: 'relative' }}>
                        <View style={styles.searchContainer}>
                            <TouchableOpacity onPress={handleSearchSubmit}>
                                <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.searchIcon} />
                            </TouchableOpacity>
                            <TextInput
                                ref={inputRef}
                                style={styles.searchInput}
                                placeholder="Search products..."
                                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                                value={localSearchTerm}
                                onChangeText={handleSearchChange}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                onSubmitEditing={handleSearchSubmit}
                                returnKeyType="search"
                            />
                            {localSearchTerm.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearchChange('')} style={styles.clearButton}>
                                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                                </TouchableOpacity>
                            )}
                        </View>
                        {showDropdown && (
                            <>
                                {/* Overlay to catch outside taps */}
                                <TouchableOpacity
                                    style={styles.dropdownOverlay}
                                    activeOpacity={1}
                                    onPress={() => {
                                        setShowDropdown(false);
                                        setIsInputFocused(false);
                                        inputRef.current?.blur();
                                    }}
                                />
                                <View style={styles.dropdownContainer}>
                                    <FlatList
                                        data={filteredProducts}
                                        keyExtractor={item => item.id}
                                        renderItem={({ item }) => (
                                            <Pressable
                                                style={styles.dropdownItem}
                                                onPress={() => handleProductPress(item.id)}
                                            >
                                                <Text style={styles.dropdownText}>{item.productName}</Text>
                                                <Text style={styles.dropdownSubText}>{item.brand}</Text>
                                            </Pressable>
                                        )}
                                        keyboardShouldPersistTaps="handled"
                                    />
                                </View>
                            </>
                        )}
                    </View>
                )}

                <View style={styles.headerIcons}>
                    {showNotificationIcon && (
                        <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
                            <Ionicons name="notifications-outline" size={24} color="white" />
                            {notificationCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
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
        paddingVertical: 20,
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
        height: 36,
        fontSize: 14,
        color: 'white',
    },
    clearButton: {
        padding: 2,
    },
    dropdownContainer: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 100,
        maxHeight: 180,
    },
    dropdownOverlay: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 99,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownText: {
        fontSize: 15,
        color: '#222',
        fontWeight: '500',
    },
    dropdownSubText: {
        fontSize: 12,
        color: '#888',
    },
});