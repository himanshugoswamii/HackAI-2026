import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function OnboardingGenderScreen({ navigation, route }: any) {
  const { age } = route.params;

  const handleSelect = (gender: string) => {
    navigation.navigate('OnboardingStyle', { age, gender });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Select your gender</Text>

      {GENDERS.map((g) => (
        <TouchableOpacity
          key={g}
          style={styles.option}
          onPress={() => handleSelect(g)}
        >
          <Text style={styles.optionText}>{g}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
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
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
});
