import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';

import {
  getWardrobeList,
  suggestOutfits,
  getImageUrl,
  type WardrobeItem,
  type Outfit,
} from '../api';
import { MAROON, WHITE, BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, ERROR_BG, FONT_CURSIVE } from '../theme';

export default function StylistScreen({ navigation }: any) {
  const [age, setAge] = useState('25');
  const [stylePreference, setStylePreference] = useState('casual');
  const [inspirationDescription, setInspirationDescription] = useState<string | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadWardrobe, setLoadWardrobe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWardrobe = useCallback(async () => {
    try {
      const data = await getWardrobeList();
      setWardrobeItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load wardrobe');
    } finally {
      setLoadWardrobe(false);
    }
  }, []);

  useEffect(() => {
    fetchWardrobe();
  }, [fetchWardrobe]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchWardrobe);
    return unsubscribe;
  }, [navigation, fetchWardrobe]);

  const handleSuggest = async () => {
    if (wardrobeItems.length === 0) {
      Alert.alert(
        'Empty wardrobe',
        'Load the demo wardrobe or add your own clothes first.'
      );
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 99) {
      Alert.alert('Invalid age', 'Enter age between 12 and 99.');
      return;
    }

    setLoading(true);
    setError(null);
    setOutfits([]);
    try {
      let lat = 40.71;
      let lon = -74.01;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      } catch (_) {}

      const res = await suggestOutfits(
        ageNum,
        stylePreference,
        wardrobeItems,
        { lat, lon, inspirationDescription: inspirationDescription ?? undefined }
      );
      setOutfits((res.outfits || []).slice(0, 3));
    } catch (e: any) {
      setError(e.message || 'Failed to get suggestions');
      Alert.alert('Error', e.message || 'Could not get outfit suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const styles_arr = ['casual', 'classy', 'streetwear', 'sporty', 'professional'];
  const MOCK_INSPIRATION = [
    'Minimal summer vibes',
    'Laid-back weekend',
    'Office-ready',
    'Date night chic',
    'Cozy and comfy',
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, Platform.OS === 'web' ? { fontFamily: `${FONT_CURSIVE}, cursive` } : {}]}>What should I wear today?</Text>
      <Text style={styles.subtitle}>AI stylist suggests outfits from your wardrobe</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          placeholder="25"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Style preference</Text>
        <View style={styles.chips}>
          {styles_arr.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                stylePreference === s && styles.chipActive,
              ]}
              onPress={() => setStylePreference(s)}
            >
              <Text
                style={[
                  styles.chipText,
                  stylePreference === s && styles.chipTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Inspiration (optional)</Text>
        <Text style={styles.inspirationHint}>Tap a vibe to guide suggestions</Text>
        <View style={styles.chips}>
          {MOCK_INSPIRATION.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                inspirationDescription === s && styles.chipActive,
              ]}
              onPress={() => setInspirationDescription(inspirationDescription === s ? null : s)}
            >
              <Text
                style={[
                  styles.chipText,
                  inspirationDescription === s && styles.chipTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSuggest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get outfit suggestions</Text>
        )}
      </TouchableOpacity>

      {loadWardrobe && wardrobeItems.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={MAROON} />
          <Text style={styles.loadingText}>Loading wardrobe...</Text>
        </View>
      ) : wardrobeItems.length === 0 && !loadWardrobe ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👔</Text>
          <Text style={styles.emptyTitle}>No clothes yet</Text>
          <Text style={styles.emptySub}>
            Load the demo wardrobe or add your own to get outfit suggestions.
          </Text>
        </View>
      ) : null}

      {outfits.length > 0 ? (
        <View style={styles.outfits}>
          <Text style={styles.outfitsTitle}>Top 3 suggested outfits</Text>
          {outfits.map((o, i) => (
            <View key={i} style={styles.outfitCard}>
              <Text style={styles.outfitTitle}>{o.title}</Text>
              {o.item_images && o.item_images.length > 0 ? (
                <View style={styles.outfitImages}>
                  {o.item_images.map((img, j) => (
                    <View key={j} style={styles.outfitImageWrap}>
                      {img.image_path && !img.image_path.startsWith('demo/') ? (
                        Platform.OS === 'web' ? (
                          <img
                            src={getImageUrl(img.image_path)}
                            alt={img.label}
                            style={styles.outfitImageWeb}
                          />
                        ) : (
                          <Image
                            source={{ uri: getImageUrl(img.image_path) }}
                            style={styles.outfitImage}
                            resizeMode="cover"
                          />
                        )
                      ) : (
                        <View style={styles.outfitImagePlaceholder}>
                          <Text style={styles.outfitImagePlaceholderText}>👕</Text>
                        </View>
                      )}
                      <Text style={styles.outfitImageLabel} numberOfLines={1}>{img.label}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.outfitItems}>{o.items.join(' · ')}</Text>
              )}
              <Text style={styles.outfitReason}>{o.reason}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    padding: 24,
    paddingTop: 48,
  },
  title: { fontSize: 24, fontWeight: '700', color: TEXT_PRIMARY },
  subtitle: { fontSize: 14, color: TEXT_MUTED, marginTop: 8, marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, color: TEXT_MUTED, marginBottom: 8 },
  inspirationHint: { fontSize: 12, color: TEXT_MUTED, marginBottom: 8 },
  input: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    color: TEXT_PRIMARY,
    fontSize: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { borderColor: MAROON, backgroundColor: 'rgba(80,0,0,0.3)' },
  chipText: { color: TEXT_MUTED, fontSize: 14 },
  chipTextActive: { color: WHITE, fontWeight: '600' },
  errorBox: {
    backgroundColor: ERROR_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: { color: '#f87171', fontSize: 14 },
  button: {
    backgroundColor: MAROON,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: WHITE, fontSize: 18, fontWeight: '600' },
  loadingBox: { alignItems: 'center', padding: 24 },
  loadingText: { color: TEXT_MUTED, marginTop: 12 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 },
  emptySub: { color: TEXT_MUTED, fontSize: 14, textAlign: 'center' },
  outfits: { marginTop: 8 },
  outfitsTitle: { fontSize: 18, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 16 },
  outfitCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  outfitTitle: { fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 },
  outfitImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  outfitImageWrap: {
    width: 72,
    alignItems: 'center',
  },
  outfitImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: BORDER,
  },
  outfitImageWeb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    objectFit: 'cover',
    backgroundColor: BORDER,
  },
  outfitImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitImagePlaceholderText: { fontSize: 28 },
  outfitImageLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginTop: 4,
    textAlign: 'center',
    width: 72,
  },
  outfitItems: { color: TEXT_PRIMARY, fontSize: 14, marginBottom: 12 },
  outfitReason: { color: TEXT_MUTED, fontSize: 14, lineHeight: 20 },
});
