import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  useWindowDimensions,
  Alert,
} from 'react-native';

import { getWardrobeList, getImageUrl, seedWardrobe, deleteWardrobeItem, type WardrobeItem } from '../api';
import { MAROON, WHITE, BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, ERROR_BG, FONT_CURSIVE } from '../theme';

const NUM_COLUMNS = 3;
const CARD_GAP = 12;
const IMAGE_ASPECT_RATIO = 3 / 4;

export default function WardrobeScreen({ navigation }: any) {
  const { width: screenWidth } = useWindowDimensions();
  const padding = 24;
  const availableWidth = screenWidth - padding * 2 - CARD_GAP * (NUM_COLUMNS - 1);
  const cardWidth = availableWidth / NUM_COLUMNS;
  const imageHeight = cardWidth / IMAGE_ASPECT_RATIO;

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWardrobeList();
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load wardrobe');
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

  const handleDelete = (item: WardrobeItem) => {
    const message = `Remove "${item.color} ${item.type}"? This item will no longer appear in Stylist or Declutter.`;
    const doDelete = async () => {
      setDeletingId(item.id);
      try {
        await deleteWardrobeItem(item.id);
        await load();
      } catch (e: any) {
        if (Platform.OS === 'web') {
          window.alert(e.message || 'Could not remove item.');
        } else {
          Alert.alert('Error', e.message || 'Could not remove item.');
        }
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) doDelete();
    } else {
      Alert.alert('Remove from wardrobe?', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const renderItem = ({ item }: { item: WardrobeItem }) => {
    const imgUri = getImageUrl(item.image_path);
    const isDemo = item.image_path?.startsWith('demo/');
    const showPlaceholder = !item.image_path || failedImages.has(item.id) || isDemo;
    const isDeleting = deletingId === item.id;

    return (
      <View style={[styles.card, { width: cardWidth }]}>
        <View style={[styles.imageContainer, { width: cardWidth, height: imageHeight }]}>
          {showPlaceholder ? (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderIcon}>👕</Text>
              <Text style={styles.placeholderText}>{isDemo ? 'Demo' : 'No image'}</Text>
            </View>
          ) : Platform.OS === 'web' ? (
            <img
              src={imgUri}
              alt={`${item.color} ${item.type}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={() => setFailedImages((prev) => new Set(prev).add(item.id))}
            />
          ) : (
            <Image
              source={{ uri: imgUri }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setFailedImages((prev) => new Set(prev).add(item.id))}
            />
          )}
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={MAROON} />
            ) : (
              <Text style={styles.deleteButtonText}>🗑</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.color} {item.type}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.style} · {item.season}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={MAROON} />
        <Text style={styles.loadingText}>Loading wardrobe...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, Platform.OS === 'web' ? { fontFamily: `${FONT_CURSIVE}, cursive` } : {}]}>Wardrobe</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Upload')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {items.length === 0 && !error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👔</Text>
          <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
          <Text style={styles.emptySub}>
            Try the demo wardrobe or add your own clothes with a photo.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButtonPrimary, seeding && styles.buttonDisabled]}
            onPress={async () => {
              setSeeding(true);
              try {
                const res = await seedWardrobe();
                if (res.seeded) await load();
              } catch (_) {}
              finally {
                setSeeding(false);
              }
            }}
            disabled={seeding}
          >
            {seeding ? (
              <ActivityIndicator size="small" color={MAROON} />
            ) : (
              <Text style={styles.emptyButtonText}>Load demo wardrobe</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Upload')}
          >
            <Text style={styles.emptyButtonTextSecondary}>Add from camera/gallery</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              tintColor={MAROON}
            />
          }
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND, paddingTop: 48 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
  },
  loadingText: { color: TEXT_MUTED, marginTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: TEXT_PRIMARY },
  addButton: {
    backgroundColor: MAROON,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: { color: WHITE, fontWeight: '600' },
  errorBox: {
    marginHorizontal: 20,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: TEXT_PRIMARY, marginBottom: 8 },
  emptySub: { color: TEXT_MUTED, marginTop: 4, marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  buttonDisabled: { opacity: 0.7 },
  emptyButtonPrimary: {
    backgroundColor: MAROON,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  emptyButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    width: '100%',
    alignItems: 'center',
  },
  emptyButtonText: { color: WHITE, fontWeight: '600' },
  emptyButtonTextSecondary: { color: TEXT_MUTED, fontWeight: '500' },
  list: { padding: 24, paddingTop: 0, paddingBottom: 24 },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  imageContainer: {
    backgroundColor: BACKGROUND,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BORDER,
  },
  placeholderIcon: { fontSize: 36, marginBottom: 4 },
  placeholderText: { fontSize: 11, color: TEXT_MUTED },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: { opacity: 0.7 },
  deleteButtonText: { fontSize: 14 },
  cardFooter: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textTransform: 'capitalize',
  },
  cardMeta: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
  },
});
