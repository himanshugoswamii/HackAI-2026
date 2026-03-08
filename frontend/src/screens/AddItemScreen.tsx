import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../contexts/UserContext';
import { addWardrobeItem } from '../api';

// For Expo, we need base64 - ImagePicker returns uri. We'll fetch and convert.
async function uriToBase64(uri: string): Promise<{ base64: string; mime: string }> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = (reader.result as string) || '';
      const base64 = data.split(',')[1] || data;
      const mime = blob.type || 'image/jpeg';
      resolve({ base64, mime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function AddItemScreen({ navigation }: any) {
  const { userId } = useUser();
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
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
      base64: true,
    });

    if (result.canceled || !result.assets?.[0] || !userId) return;

    setLoading(true);
    try {
      const asset = result.assets[0];
      const base64 = asset.base64;
      const mime = asset.mimeType || 'image/jpeg';

      if (!base64) {
        // Fallback: fetch uri and convert
        const { base64: b64, mime: m } = await uriToBase64(asset.uri);
        await addWardrobeItem(userId, b64, m);
      } else {
        await addWardrobeItem(userId, base64, mime);
      }
      Alert.alert('Added!', 'Item added to your wardrobe.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add wardrobe item</Text>
      <Text style={styles.subtitle}>
        Take or pick a photo of a clothing item. Miranda will classify it.
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={pickImage}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pick from gallery</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
