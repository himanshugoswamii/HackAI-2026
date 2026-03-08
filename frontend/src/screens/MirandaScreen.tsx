import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';

import { useUser } from '../contexts/UserContext';
import { getMirandaSuggestion } from '../api';

export default function MirandaScreen({ navigation }: any) {
  const { userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ outfit_ids: number[]; explanation: string } | null>(null);

  const handleSuggest = async () => {
    if (!userId) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await getMirandaSuggestion(userId);
      setResult(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Miranda could not suggest an outfit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✨ Miranda</Text>
      <Text style={styles.subtitle}>
        AI Personal Stylist — suggests outfits based on your wardrobe, style, and weather
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSuggest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get outfit suggestion</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Outfit suggestion</Text>
          <Text style={styles.resultIds}>
            Item IDs: {result.outfit_ids.join(', ') || 'None'}
          </Text>
          <Text style={styles.explanation}>{result.explanation}</Text>
        </View>
      )}
    </ScrollView>
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
    fontSize: 28,
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
  result: {
    marginTop: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  resultIds: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  explanation: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
});
