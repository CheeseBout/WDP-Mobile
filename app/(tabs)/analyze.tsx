import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { AnalysisResult, analyzeImage, uploadImageToFirebase } from "../../services/analyze.service";

export default function AnalyzeScreen() {
   const [image, setImage] = useState<string | null>(null);
   const [uploading, setUploading] = useState<boolean>(false);
   const [firebaseUrl, setFirebaseUrl] = useState<string | null>(null);
   const [prediction, setPrediction] = useState<AnalysisResult | null>(null);
   const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      // Request camera and media library permissions
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Keep for backward compatibility
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Keep for backward compatibility
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

    try {
      const downloadUrl = await uploadImageToFirebase(uri);
      console.log("File uploaded to Firebase:", downloadUrl);
      setFirebaseUrl(downloadUrl);
    } catch (error) {
      console.error("Error uploading to Firebase:", error);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const analyzeSkin = async () => {
    if (!image) {
      Alert.alert("No image", "Please take or select an image first");
      return;
    }

    setLoading(true);

    try {
      const result = await analyzeImage(image);
      console.log("Prediction result:", result);
      setPrediction(result);
    } catch (error) {
      console.error("Prediction failed:", error);
      Alert.alert("Error", "Skin analysis failed. Please try again.");
      setPrediction({ error: "Analysis failed. Please try again." });
    } finally {
      setLoading(false);
    }
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
              <Image source={{ uri: image }} style={styles.imagePreview} />
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
                  onPress={() => {
                    setPrediction(null);
                    setFirebaseUrl(null);
                    setImage(null);
                  }}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : prediction.prediction ? (
              <View style={styles.successResult}>
                <Text style={styles.successTitle}>Skin Type Detected</Text>
                <Text style={styles.skinType}>{prediction.prediction.skinType}</Text>
                <Text style={styles.analysisId}>Analysis ID: #{prediction.prediction.predictionIndex}</Text>
              </View>
            ) : (
              <View style={styles.infoResult}>
                <Text style={styles.infoTitle}>No Data Available</Text>
                <Text style={styles.infoText}>The analysis completed but no data was returned</Text>
              </View>
            )}
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
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
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
});
