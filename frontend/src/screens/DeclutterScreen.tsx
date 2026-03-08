import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';

import {
  getDeclutterSuggestions,
  type DeclutterSuggestion,
} from '../api';
import { MAROON, BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, ERROR_BG, FONT_CURSIVE } from '../theme';

export default function DeclutterScreen({ navigation }: any) {
  const [suggestions, setSuggestions] = useState<DeclutterSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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

      const res = await getDeclutterSuggestions(lat, lon);
      setSuggestions(res.suggestions || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  if (loading && suggestions.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={MAROON} />
        <Text style={styles.loadingText}>Finding items to declutter...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={MAROON} />
      }
    >
      <Text style={[styles.title, Platform.OS === 'web' ? { fontFamily: `${FONT_CURSIVE}, cursive` } : {}]}>Declutter</Text>
      <Text style={styles.subtitle}>
        In-season pieces you haven't worn in 5 minutes from last outfit suggestion
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {suggestions.length === 0 && !error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyTitle}>Your wardrobe is looking good</Text>
          <Text style={styles.emptySub}>
            No items to donate right now. We suggest in-season pieces you haven't worn in 5 minutes from last outfit suggestion.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {suggestions.map((s, i) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemDesc}>
                  {s.item.color} {s.item.type}
                </Text>
                <Text style={styles.itemMeta}>
                  {s.item.style} · {s.item.season}
                </Text>
              </View>
              <Text style={styles.explanation}>{s.explanation}</Text>
            </View>
          ))}
        </View>
      )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
  },
  loadingText: { color: TEXT_MUTED, marginTop: 16 },
  title: { fontSize: 24, fontWeight: '700', color: TEXT_PRIMARY },
  subtitle: { fontSize: 14, color: TEXT_MUTED, marginTop: 8, marginBottom: 24 },
  errorBox: {
    backgroundColor: ERROR_BG,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { color: '#f87171', flex: 1 },
  retryButton: { marginLeft: 12 },
  retryText: { color: MAROON, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    padding: 48,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 },
  emptySub: { color: TEXT_MUTED, marginTop: 4, textAlign: 'center', lineHeight: 22 },
  list: { gap: 12 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: { marginBottom: 12 },
  itemDesc: { fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY },
  itemMeta: { fontSize: 12, color: TEXT_MUTED, marginTop: 4 },
  explanation: { color: TEXT_MUTED, fontSize: 14, lineHeight: 22 },
});
