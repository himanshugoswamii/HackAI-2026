import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { uploadClothingImage, addToWardrobe, invalidateWardrobeCache } from '../api';
import { MAROON, WHITE, BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, ERROR_BG, FONT_CURSIVE } from '../theme';

export default function UploadScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to add items.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await handleUpload(result.assets[0].uri, result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await handleUpload(result.assets[0].uri, result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const handleUpload = async (uri: string, mimeType: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadClothingImage(uri, mimeType);
      const c = res.classification;
      await addToWardrobe({
        type: c.type,
        color: c.color,
        style: c.style,
        season: c.season,
        formality: c.formality,
        image_path: res.image_path,
      });
      invalidateWardrobeCache();
      Alert.alert('Added!', 'Item added to your wardrobe.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
      Alert.alert('Error', e.message || 'Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, Platform.OS === 'web' ? { fontFamily: `${FONT_CURSIVE}, cursive` } : {}]}>Add clothing</Text>
      <Text style={styles.subtitle}>Take a photo or choose from gallery. AI will classify it.</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={MAROON} />
          <Text style={styles.loadingText}>Uploading photo...</Text>
        <Text style={styles.loadingSubtext}>AI is classifying your item (usually 5–15 sec)</Text>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonEmoji}>📷</Text>
            <Text style={styles.buttonText}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
            <Text style={styles.buttonEmoji}>🖼️</Text>
            <Text style={styles.buttonText}>Choose from gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 8,
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: ERROR_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
  },
  loadingBox: {
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    color: TEXT_MUTED,
    marginTop: 16,
  },
  loadingSubtext: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 8,
  },
  buttons: {
    gap: 16,
  },
  button: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  buttonEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  buttonText: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '600',
  },
});
