import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { checkSimilarInWardrobe, getImageUrl, type WardrobeItem } from '../api';
import { BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, ERROR_BG, FONT_CURSIVE } from '../theme';

export default function DoINeedThisScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ similar_items: WardrobeItem[]; count: number } | null>(null);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to check your wardrobe.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setResult(null);
      setError(null);
      await runCheck(res.assets[0].uri, res.assets[0].mimeType || 'image/jpeg');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setResult(null);
      setError(null);
      await runCheck(res.assets[0].uri, res.assets[0].mimeType || 'image/jpeg');
    }
  };

  const runCheck = async (uri: string, mimeType: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkSimilarInWardrobe(uri, mimeType);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Check failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, Platform.OS === 'web' ? { fontFamily: `${FONT_CURSIVE}, cursive` } : {}]}>
        Do I need this?
      </Text>
      <Text style={styles.subtitle}>
        Upload a photo of a clothing item. We'll check your wardrobe for similar pieces.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={TEXT_PRIMARY} />
          <Text style={styles.loadingText}>Comparing with your wardrobe...</Text>
          <Text style={styles.loadingSubtext}>AI can take 20–40 seconds. Please wait.</Text>
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

      {result !== null && !loading && (
        <View style={styles.resultSection}>
          <View style={styles.countCard}>
            <Text style={styles.countNumber}>{result.count}</Text>
            <Text style={styles.countLabel}>
              {result.count === 1 ? 'similar item' : 'similar items'} in your wardrobe
            </Text>
          </View>
          {result.similar_items.length > 0 ? (
            <>
              <Text style={styles.resultTitle}>Similar items</Text>
              <View style={styles.itemGrid}>
                {result.similar_items.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemImageWrap}>
                      {item.image_path && !item.image_path.startsWith('demo/') ? (
                        <Image
                          source={{ uri: getImageUrl(item.image_path) }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.itemPlaceholder}>
                          <Text style={styles.itemPlaceholderText}>👕</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemLabel} numberOfLines={2}>
                      {item.color} {item.type}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.noSimilar}>No similar items found. You might not have this in your closet yet.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  content: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 8,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: ERROR_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: { color: '#b91c1c', fontSize: 14 },
  loadingBox: { alignItems: 'center', padding: 32 },
  loadingText: { color: TEXT_MUTED, marginTop: 16 },
  loadingSubtext: { color: TEXT_MUTED, fontSize: 12, marginTop: 8 },
  buttons: { gap: 16, marginBottom: 32 },
  button: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  buttonEmoji: { fontSize: 32, marginRight: 16 },
  buttonText: { color: TEXT_PRIMARY, fontSize: 18, fontWeight: '600' },
  resultSection: { marginTop: 8 },
  countCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
  },
  countNumber: { fontSize: 42, fontWeight: '700', color: TEXT_PRIMARY },
  countLabel: { fontSize: 15, color: TEXT_MUTED, marginTop: 4 },
  resultTitle: { fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 12 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard: { width: '30%', minWidth: 90, maxWidth: 120 },
  itemImageWrap: { aspectRatio: 3 / 4, borderRadius: 12, overflow: 'hidden', backgroundColor: BORDER },
  itemImage: { width: '100%', height: '100%' },
  itemPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG,
  },
  itemPlaceholderText: { fontSize: 28 },
  itemLabel: { fontSize: 12, color: TEXT_MUTED, marginTop: 6 },
  noSimilar: { fontSize: 15, color: TEXT_MUTED, fontStyle: 'italic', marginTop: 8 },
});
