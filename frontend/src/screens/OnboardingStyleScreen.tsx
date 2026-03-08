import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { createUser } from '../api';
import { useUser } from '../contexts/UserContext';
import type { StylePreference } from '../contexts/UserContext';

const STYLES: StylePreference[] = [
  'Classy',
  'Street wear',
  'Professional',
  'Old-money',
  'Bohemian',
  'Minimalist',
  'Sporty',
  'Casual',
];

export default function OnboardingStyleScreen({ navigation, route }: any) {
  const { age, gender } = route.params;
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<StylePreference | null>(null);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const user = await createUser(age, gender, selected ?? undefined);
      setUser(user.id, age, gender, selected);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose your style preference</Text>
      <Text style={styles.subtitle}>
        Miranda will use this as a starting point for outfit suggestions
      </Text>

      {STYLES.map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.option, selected === s && styles.optionSelected]}
          onPress={() => setSelected(s)}
        >
          <Text style={styles.optionText}>{s}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get Started</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  option: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#1e1b4b',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
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
