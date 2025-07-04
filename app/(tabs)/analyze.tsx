import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { AnalysisResult, analyzeImage, getProductById, RecommendedProduct, uploadImageToFirebase } from "../../services/analyze.service";
import { Product as ProductAPI } from "../../services/product.service";

interface Product {
  id: string;
  productName: string;
  price: number;
  productImages: string[];
  productDescription: string;
  category: string[];
  brand: string;
  suitableFor: string;
  salePercentage: number;
  expiryDate: string;
  stock: number;
}

interface ProductWithDetails extends RecommendedProduct {
  productDetails?: ProductAPI;
  loading?: boolean;
}

export default function AnalyzeScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [firebaseUrl, setFirebaseUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [productsWithDetails, setProductsWithDetails] = useState<ProductWithDetails[]>([]);

  useEffect(() => {
    (async () => {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        cameraPermission.status !== "granted" ||
        mediaLibraryPermission.status !== "granted"
      ) {
        alert("Permission to access camera and media library is required!");
      }
    })();
  }, []);

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        uploadToFirebase(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        uploadToFirebase(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadToFirebase = async (uri: string) => {
    setUploading(true);
    setPrediction(null);
    setProductsWithDetails([]);

    try {
      const downloadUrl = await uploadImageToFirebase(uri);
      setFirebaseUrl(downloadUrl);
    } catch (error) {
      console.error("Error uploading to Firebase:", error);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const fetchProductDetails = async (products: RecommendedProduct[]) => {
    const updatedProducts: ProductWithDetails[] = products.map(product => ({
      ...product,
      loading: true
    }));

    setProductsWithDetails(updatedProducts);

    for (let i = 0; i < products.length; i++) {
      try {
        const productDetails = await getProductById(products[i].productId);
        setProductsWithDetails(prev =>
          prev.map((item, index) =>
            index === i
              ? { ...item, productDetails: productDetails?.data || productDetails, loading: false }
              : item
          )
        );
      } catch (error) {
        setProductsWithDetails(prev =>
          prev.map((item, index) =>
            index === i
              ? { ...item, loading: false }
              : item
          )
        );
      }
    }
  };

  const analyzeSkin = async () => {
    if (!image) {
      Alert.alert("No image", "Please take or select an image first");
      return;
    }

    // Check if Firebase URL is available before proceeding
    if (!firebaseUrl) {
      Alert.alert("Please wait", "Image is still uploading. Please try again in a moment.");
      return;
    }

    setLoading(true);

    try {
      // Pass the Firebase URL to the analyze function
      const result = await analyzeImage(image, firebaseUrl);
      setPrediction(result);

      if (result.analysis && result.analysis.recommendedProducts.length > 0) {
        await fetchProductDetails(result.analysis.recommendedProducts);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert("Error", "Skin analysis failed. Please try again.");
      setPrediction({ error: "Analysis failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Format price as in home.tsx and index.tsx
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Discounted price logic
  const calculateDiscountedPrice = (price: number, salePercentage: number) => {
    return price - (price * salePercentage / 100);
  };

  // Show product image like in home.tsx/index.tsx
  const renderProductItem = ({ item }: { item: ProductWithDetails }) => {
    const details = item.productDetails as ProductAPI | undefined;
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          if (details) {
            router.push(`/(tabs)/${details.id}` as any);
          }
        }}
        activeOpacity={0.9}
      >
        {item.loading ? (
          <View style={styles.productLoading}>
            <ActivityIndicator size="small" color="#1565C0" />
            <Text style={styles.productLoadingText}>Loading...</Text>
          </View>
        ) : details ? (
          <>
            <View style={styles.productImageContainer}>
              <Image
                source={{ uri: details.productImages?.[0] || "" }}
                style={styles.productImage}
                resizeMode="cover"
                onError={() => {}}
              />
              {details.salePercentage > 0 && (
                <View style={styles.saleBadge}>
                  <Text style={styles.saleBadgeText}>-{details.salePercentage}%</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{details.productName}</Text>
              <Text style={styles.productBrand}>{details.brand}</Text>
              <View style={styles.priceRow}>
                {details.salePercentage > 0 ? (
                  <>
                    <Text style={styles.originalPrice}>{formatPrice(details.price)}</Text>
                    <Text style={styles.discountedPrice}>
                      {formatPrice(calculateDiscountedPrice(details.price, details.salePercentage))}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.price}>{formatPrice(details.price)}</Text>
                )}
              </View>
              <Text style={styles.recommendationReason}>{item.reason}</Text>
              <Text style={styles.productCategory}>
                {Array.isArray(details.category) ? details.category.join(", ") : details.category}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.productError}>
            <Text style={styles.errorText}>Failed to load product</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const resetAnalysis = () => {
    setPrediction(null);
    setFirebaseUrl(null);
    setImage(null);
    setProductsWithDetails([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Skin Analysis</Text>
          <Text style={styles.subtitle}>AI-Powered Health Assessment</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.uploadSection}>
          <View style={styles.imageContainer}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.imagePreview}
                resizeMode="cover"
                onError={() => {}}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>Upload Image</Text>
                <Text style={styles.placeholderSubtext}>Take a photo or choose from gallery</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={takePicture}>
              <Text style={styles.primaryButtonText}>📸 Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
              <Text style={styles.secondaryButtonText}>🖼️ Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {uploading && (
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.statusText}>Uploading image...</Text>
          </View>
        )}

        {firebaseUrl && !uploading && (
          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
            onPress={analyzeSkin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>🔍 Start Analysis</Text>
            )}
          </TouchableOpacity>
        )}

        {prediction && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeader}>Analysis Results</Text>
            {prediction.error ? (
              <View style={styles.errorResult}>
                <Text style={styles.errorTitle}>Analysis Failed</Text>
                <Text style={styles.errorText}>{prediction.error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={resetAnalysis}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : prediction.analysis ? (
              <>
                <View style={styles.successResult}>
                  <Text style={styles.successTitle}>Skin Type Detected</Text>
                  <Text style={styles.skinType}>{prediction.analysis.skinType.toUpperCase()}</Text>
                  <Text style={styles.analysisDate}>
                    Analyzed on {new Date(prediction.analysis.analysisDate).toLocaleDateString()}
                  </Text>

                  {prediction.analysis.recommendedProducts.length > 0 ? (
                    <Text style={styles.recommendationsCount}>
                      {prediction.analysis.recommendedProducts.length} products recommended
                    </Text>
                  ) : (
                    <Text style={styles.noRecommendationsText}>
                      No product recommendations available
                    </Text>
                  )}
                </View>

                {prediction.analysis.recommendedProducts.length > 0 && (
                  <View style={styles.recommendationsSection}>
                    <Text style={styles.sectionTitle}>Recommended Products</Text>
                    <FlatList
                      data={productsWithDetails}
                      keyExtractor={(item) => item._id}
                      renderItem={renderProductItem}
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={false}
                      contentContainerStyle={styles.productsList}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.newAnalysisButton}
                  onPress={resetAnalysis}
                >
                  <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        )}
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  headerContainer: {
    backgroundColor: '#1565C0',
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 35,
    paddingBottom: 25,
    minHeight: '100%',
  },
  uploadSection: {
    marginBottom: 25,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F8FAFE',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  placeholderText: {
    color: '#1565C0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: '#90CAF9',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#1565C0',
    padding: 16,
    borderRadius: 15,
    width: '48%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 15,
    width: '48%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1565C0',
  },
  secondaryButtonText: {
    color: '#1565C0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusCard: {
    backgroundColor: '#F8FAFE',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  statusText: {
    marginTop: 15,
    color: '#1565C0',
    fontSize: 16,
    fontWeight: '500',
  },
  analyzeButton: {
    backgroundColor: '#1565C0',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 15,
    textAlign: 'center',
  },
  successResult: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 15,
  },
  skinType: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1565C0',
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  analysisId: {
    fontSize: 14,
    color: '#90CAF9',
    fontWeight: '500',
  },
  errorResult: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 10,
  },
  errorText: {
    color: '#C62828',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  infoResult: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 10,
  },
  infoText: {
    color: '#1565C0',
    fontSize: 16,
    textAlign: 'center',
  },
  recommendationsCount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 10,
  },
  noRecommendationsText: {
    fontSize: 14,
    color: '#90CAF9',
    fontWeight: '500',
    marginTop: 10,
  },
  analysisDate: {
    fontSize: 12,
    color: '#90CAF9',
    marginTop: 5,
  },
  recommendationsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 15,
  },
  productsList: {
    paddingBottom: 10,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  saleBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  saleBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  recommendationReason: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 10,
    color: '#90CAF9',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  productLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 20,
  },
  productLoadingText: {
    marginLeft: 8,
    color: '#1565C0',
    fontSize: 12,
  },
  productError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  newAnalysisButton: {
    backgroundColor: '#42A5F5',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  newAnalysisButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});