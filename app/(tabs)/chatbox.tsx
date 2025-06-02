import { fetchAllProductsForAI, Product, searchProductsForAI } from '@/services/product.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    products?: Product[];
}

export default function ChatboxScreen() {
    const [messages, setMessages] = useState<Message[]>(
        [
            {
                id: '1',
                text: "Hello! I'm your pharmacy assistant. I can recommend products from our inventory based on your needs. How can I help you today?",
                isUser: false,
                timestamp: new Date()
            }
        ]
    );
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoaded, setProductsLoaded] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const result = await fetchAllProductsForAI();
            if ('error' in result) {
                console.error('Error loading products:', result.error);
                setProducts([]);
            } else {
                setProducts(result);
                console.log('Loaded', result.length, 'products for AI recommendations');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            setProducts([]);
        } finally {
            setProductsLoaded(true);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const isProductRecommendationQuery = (query: string): boolean => {
        const recommendationKeywords = [
            'recommend', 'suggestion', 'suggest', 'best', 'good', 'effective',
            'product', 'medicine', 'skincare', 'cosmetic', 'cream', 'treatment',
            'vitamin', 'supplement', 'pain relief', 'anti-aging', 'moisturizer',
            'acne', 'dry skin', 'oily skin', 'sensitive skin', 'wrinkle', 'spot',
            'blemish', 'hydrating', 'cleansing', 'serum', 'lotion', 'face care',
            'health', 'wellness', 'care'
        ];
        return recommendationKeywords.some(keyword => 
            query.toLowerCase().includes(keyword)
        );
    };

    const getRelevantProducts = async (query: string): Promise<Product[]> => {
        if (products.length === 0) return [];
        
        try {
            console.log(`Searching through ${products.length} loaded products for query: "${query}"`);
            
            const relevantProducts = searchProductsForAI(products, query);
            console.log(`Found ${relevantProducts.length} relevant products for query: "${query}"`);
            return relevantProducts.slice(0, 3); // Reduced to top 3 products for cleaner display
        } catch (error) {
            console.error('Error getting relevant products:', error);
            return [];
        }
    };

    const formatProductsForResponse = (products: Product[]): string => {
        if (products.length === 0) return "No matching products found in our inventory.";
        
        // Simply return product names as a clean list
        const productNames = products.map((product, index) => 
            `${index + 1}. ${product.productName}`
        );
        
        return productNames.join('\n');
    };

    const sendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const question = inputText.trim();
        setInputText('');
        setIsLoading(true);

        // Simulate processing time for better UX
        setTimeout(async () => {
            let responseText = "";
            let recommendedProducts: Product[] = [];

            // Check if this is a product recommendation query
            if (isProductRecommendationQuery(question) && productsLoaded) {
                console.log('Detected product recommendation query, searching products...');
                recommendedProducts = await getRelevantProducts(question);
                
                if (recommendedProducts.length > 0) {
                    const productList = formatProductsForResponse(recommendedProducts);
                    responseText = `Based on your request, I found ${recommendedProducts.length} suitable products:\n\n${productList}\n\nThese products are available in our pharmacy. Please consult with our pharmacist for personalized advice.`;
                } else {
                    responseText = "I couldn't find any products matching your request in our current inventory. Please visit our pharmacy counter for alternatives.";
                }
            } else {
                // General pharmacy responses
                const responses = [
                    "Thank you for your question. Please consult with our pharmacist for specific medical advice.",
                    "I understand your concern. Our healthcare professionals can provide personalized recommendations.",
                    "That's a great question. Our pharmacy team can provide detailed guidance.",
                    "For medication questions, please speak with our licensed pharmacist.",
                    "Please visit our pharmacy counter for professional medical consultation."
                ];
                responseText = responses[Math.floor(Math.random() * responses.length)];
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                isUser: false,
                timestamp: new Date(),
                products: recommendedProducts.length > 0 ? recommendedProducts : undefined
            };

            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        }, 1500);
    };

    const renderProductCard = ({ item }: { item: Product }) => (
        <TouchableOpacity style={styles.productCard} activeOpacity={0.8}>
            <View style={styles.productImageContainer}>
                <View style={styles.productImagePlaceholder}>
                    <Ionicons name="medical-outline" size={24} color="#1565C0" />
                </View>
                <View style={styles.productBadge}>
                    <Text style={styles.productBadgeText}>NEW</Text>
                </View>
            </View>
            <View style={styles.productDetails}>
                <Text style={styles.productBrand}>{item.brand}</Text>
                <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                    <View style={styles.stockBadge}>
                        <Text style={styles.stockBadgeText}>{item.stock}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.isUser ? styles.userMessageContainer : styles.aiMessageContainer
        ]}>
            {!item.isUser && (
                <View style={styles.messageBotAvatar}>
                    <Ionicons name="medical" size={16} color="#1565C0" />
                </View>
            )}
            <View style={[
                styles.messageBubble,
                item.isUser ? styles.userMessage : styles.aiMessage
            ]}>
                <Text style={[
                    styles.messageText,
                    item.isUser ? styles.userMessageText : styles.aiMessageText
                ]}>
                    {item.text}
                </Text>
                
                {/* Enhanced Product Cards */}
                {item.products && item.products.length > 0 && (
                    <View style={styles.productsContainer}>
                        <View style={styles.productsHeader}>
                            <Ionicons name="storefront-outline" size={16} color="#1565C0" />
                            <Text style={styles.productsTitle}>Available Products</Text>
                        </View>
                        <FlatList
                            data={item.products}
                            renderItem={renderProductCard}
                            keyExtractor={(product) => product.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.productsList}
                        />
                    </View>
                )}
                
                <Text style={[
                    styles.timestamp,
                    item.isUser ? styles.userTimestamp : styles.aiTimestamp
                ]}>
                    {formatTime(item.timestamp)}
                </Text>
            </View>
        </View>
    );

    const clearChatHistory = () => {
        Alert.alert(
            'Clear Chat History',
            'Are you sure you want to clear all chat messages? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setMessages([
                            {
                                id: '1',
                                text: "Hello! I'm your pharmacy assistant. I can recommend products from our inventory based on your needs. How can I help you today?",
                                isUser: false,
                                timestamp: new Date()
                            }
                        ]);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Modern Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.botIndicator}>
                        <View style={styles.botAvatar}>
                            <View style={styles.botIcon}>
                                <Ionicons name="medical" size={20} color="#fff" />
                            </View>
                            <View style={styles.onlineIndicator} />
                        </View>
                        <View style={styles.botInfo}>
                            <Text style={styles.botName}>PharmaBot</Text>
                            <Text style={styles.botStatus}>
                                {productsLoaded ? 'Online • Ready to help' : 'Loading inventory...'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.headerAction} onPress={clearChatHistory}>
                        <Ionicons name="trash-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                {!productsLoaded && (
                    <View style={styles.loadingBar}>
                        <View style={styles.loadingProgress} />
                    </View>
                )}
            </View>

            {/* Chat Messages */}
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                inverted={false}
            />

            {/* Typing Indicator */}
            {isLoading && (
                <View style={styles.typingContainer}>
                    <View style={styles.typingBubble}>
                        <View style={styles.typingDots}>
                            <View style={[styles.dot, styles.dot1]} />
                            <View style={[styles.dot, styles.dot2]} />
                            <View style={[styles.dot, styles.dot3]} />
                        </View>
                    </View>
                    <Text style={styles.typingText}>PharmaBot is thinking...</Text>
                </View>
            )}

            {/* Quick Actions */}
            {messages.length <= 1 && (
                <View style={styles.quickActions}>
                    <Text style={styles.quickActionsTitle}>Quick suggestions</Text>
                    <View style={styles.suggestionsGrid}>
                        {['Skincare for acne', 'Pain relief', 'Vitamins', 'Anti-aging'].map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionChip}
                                onPress={() => setInputText(suggestion)}
                            >
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Modern Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputKeyboard}
            >
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputBar}>
                            <TouchableOpacity style={styles.attachButton}>
                                <Ionicons name="add" size={24} color="#1565C0" />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.textInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Ask about products, health advice..."
                                placeholderTextColor="#999"
                                multiline
                                maxLength={300}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                                onPress={sendMessage}
                                disabled={!inputText.trim() || isLoading}
                            >
                                <Ionicons 
                                    name={inputText.trim() ? "send" : "mic"} 
                                    size={20} 
                                    color="#fff" 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.disclaimer}>
                        AI-powered assistance • Always consult healthcare professionals
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFE',
    },
    header: {
        backgroundColor: '#1565C0',
        paddingTop: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    botIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    botAvatar: {
        position: 'relative',
        marginRight: 12,
    },
    botIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#1565C0',
    },
    botInfo: {
        flex: 1,
    },
    botName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    botStatus: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    headerAction: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBar: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    loadingProgress: {
        height: '100%',
        width: '40%',
        backgroundColor: '#fff',
        opacity: 0.8,
    },
    messagesList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messagesContent: {
        paddingVertical: 20,
    },
    messageContainer: {
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    aiMessageContainer: {
        justifyContent: 'flex-start',
    },
    messageBotAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 4,
    },
    messageBubble: {
        maxWidth: '85%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    userMessage: {
        backgroundColor: '#1565C0',
        borderBottomRightRadius: 6,
        marginLeft: 40,
    },
    aiMessage: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 6,
    },
    userMessageText: {
        color: '#fff',
    },
    aiMessageText: {
        color: '#1A1A1A',
    },
    timestamp: {
        fontSize: 11,
        alignSelf: 'flex-end',
        opacity: 0.7,
    },
    userTimestamp: {
        color: 'rgba(255,255,255,0.8)',
    },
    aiTimestamp: {
        color: '#666',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    typingBubble: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1565C0',
        marginHorizontal: 2,
    },
    dot1: { opacity: 0.4 },
    dot2: { opacity: 0.7 },
    dot3: { opacity: 1 },
    typingText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    quickActions: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    quickActionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1565C0',
        marginBottom: 12,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    suggestionText: {
        fontSize: 13,
        color: '#1565C0',
        fontWeight: '500',
    },
    inputKeyboard: {
        backgroundColor: '#fff',
    },
    inputContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 20 : 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    inputWrapper: {
        marginBottom: 8,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F8F9FA',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E3F2FD',
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    attachButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        maxHeight: 100,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1565C0',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },
    disclaimer: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    productsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    productsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    productsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1565C0',
        marginLeft: 6,
    },
    productsList: {
        paddingRight: 16,
    },
    productCard: {
        backgroundColor: '#F8FAFE',
        borderRadius: 16,
        padding: 12,
        marginRight: 12,
        width: 160,
        borderWidth: 1,
        borderColor: '#E3F2FD',
    },
    productImageContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    productImagePlaceholder: {
        width: '100%',
        height: 80,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    productBadgeText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '600',
    },
    productDetails: {
        alignItems: 'flex-start',
    },
    productBrand: {
        fontSize: 10,
        color: '#666',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        lineHeight: 18,
    },
    productPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1565C0',
    },
    stockBadge: {
        backgroundColor: '#E8F5E8',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    stockBadgeText: {
        fontSize: 10,
        color: '#4CAF50',
        fontWeight: '600',
    },
    viewProductButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    viewProductText: {
        fontSize: 11,
        color: '#1565C0',
        fontWeight: '600',
        marginRight: 4,
    },
});