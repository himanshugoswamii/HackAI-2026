import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useUser } from '../contexts/UserContext';
import { getWardrobe } from '../api';

export default function HomeScreen({ navigation }: any) {
  const { userId } = useUser();
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getWardrobe(userId)
      .then(setWardrobe)
      .catch((e) => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Neural Threads</Text>
      <Text style={styles.subtitle}>Your digital wardrobe & stylists</Text>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Miranda')}
        >
          <Text style={styles.cardEmoji}>✨</Text>
          <Text style={styles.cardTitle}>Miranda</Text>
          <Text style={styles.cardDesc}>AI Stylist — outfit suggestions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Monica')}
        >
          <Text style={styles.cardEmoji}>🧹</Text>
          <Text style={styles.cardTitle}>Monica</Text>
          <Text style={styles.cardDesc}>Declutter — donate unworn items</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wardrobe</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddItem')}>
            <Text style={styles.addButton}>+ Add item</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#6366f1" style={{ marginVertical: 24 }} />
        ) : wardrobe.length === 0 ? (
          <Text style={styles.emptyText}>
            No items yet. Add clothes to get outfit suggestions.
          </Text>
        ) : (
          <FlatList
            data={wardrobe}
            horizontal
            keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemPlaceholder}>
                  <Text style={styles.itemPlaceholderText}>👕</Text>
                </View>
                <Text style={styles.itemAttr}>
                  {(item.attributes?.category ?? 'item').charAt(0).toUpperCase() +
                    (item.attributes?.category ?? 'item').slice(1)}
                </Text>
                <Text style={styles.itemColor}>{item.attributes?.color ?? ''}</Text>
              </View>
            )}
            contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.inspirationButton}
        onPress={() => navigation.navigate('AddInspiration')}
      >
        <Text style={styles.inspirationButtonText}>+ Add inspiration image</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 48,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  cards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  card: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cardDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    color: '#6366f1',
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  itemCard: {
    width: 100,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemPlaceholder: {
    width: 76,
    height: 76,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPlaceholderText: {
    fontSize: 32,
  },
  itemAttr: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
  },
  itemColor: {
    color: '#888',
    fontSize: 10,
  },
  inspirationButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  inspirationButtonText: {
    color: '#6366f1',
    fontSize: 14,
  },
});
