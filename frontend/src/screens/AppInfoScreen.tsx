import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  useWindowDimensions,
  Platform,
  TextInput,
} from 'react-native';
import { CREAM, TEXT_PRIMARY, TEXT_MUTED, BORDER, FONT_CURSIVE, CARD_BG } from '../theme';
import { useUser } from '../contexts/UserContext';

const GENDER_OPTIONS = ['Woman', 'Man', 'Non-binary'] as const;

const steps = [
  { icon: '👔', title: 'Wardrobe', desc: 'Add your clothes with a photo—AI classifies each item. Browse your digital closet in a clean grid.' },
  { icon: '✨', title: 'Stylist', desc: 'Ask “What should I wear?” Pick your style and get top 3 outfit suggestions with photos and reasons.' },
  { icon: '🤔', title: 'Do I need this?', desc: 'Check if you have a similar item and then decide if you really need this!', route: 'DoINeedThis' },
  { icon: '🧹', title: 'Declutter', desc: 'See in-season pieces you haven’t worn lately. Get friendly suggestions on what to donate.' },
];

export default function AppInfoScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 48;
  const { setOnboardingProfile } = useUser();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slide1 = useRef(new Animated.Value(24)).current;
  const slide2 = useRef(new Animated.Value(24)).current;
  const slide3 = useRef(new Animated.Value(24)).current;
  const slide4 = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.stagger(120, [
        Animated.timing(slide1, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(slide2, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(slide3, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(slide4, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeAnim, slide1, slide2, slide3, slide4]);

  const slides = [slide1, slide2, slide3, slide4];
  const cursive = Platform.OS === 'web' ? { fontFamily: `${FONT_CURSIVE}, cursive` } : {};

  const onGoToApp = () => {
    if (name.trim()) setOnboardingProfile(name, gender || '');
    navigation.replace('Main');
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>Your name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter your name"
            placeholderTextColor={TEXT_MUTED}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Text style={[styles.profileLabel, { marginTop: 20 }]}>Gender</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.genderBtn, gender === opt && styles.genderBtnActive]}
                onPress={() => setGender(opt)}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderBtnText, gender === opt && styles.genderBtnTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.heroTitle, cursive]}>Your smarter closet awaits</Text>
          <Text style={styles.heroSub}>
            Discover what to wear and what to let go—powered by AI.
          </Text>
        </View>

        <View style={styles.cards}>
          {steps.map((step, i) => {
            const isTouchable = 'route' in step && step.route;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.card,
                  { width: cardWidth },
                  { opacity: fadeAnim, transform: [{ translateY: slides[i] }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardInner}
                  activeOpacity={isTouchable ? 0.85 : 1}
                  onPress={isTouchable ? () => navigation.navigate(step.route) : undefined}
                  disabled={!isTouchable}
                >
                  <View style={styles.cardThumb}>
                    <Text style={styles.cardIcon}>{step.icon}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, cursive]}>{step.title}</Text>
                    <Text style={styles.cardDesc}>{step.desc}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={onGoToApp}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Go to app</Text>
          <Text style={styles.chevron}>{'  >>'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
  profileSection: {
    marginBottom: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT_PRIMARY,
    backgroundColor: CREAM,
  },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CREAM,
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: TEXT_PRIMARY,
    backgroundColor: TEXT_PRIMARY,
  },
  genderBtnText: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  genderBtnTextActive: { color: CREAM },
  hero: { marginBottom: 32 },
  heroTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
    lineHeight: 40,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 15,
    color: TEXT_MUTED,
    lineHeight: 22,
    maxWidth: 300,
  },
  cards: { gap: 16, marginBottom: 28 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardThumb: {
    width: 80,
    height: 80,
    margin: 16,
    borderRadius: 16,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 36 },
  cardBody: { flex: 1, paddingVertical: 16, paddingRight: 20 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  button: {
    backgroundColor: TEXT_PRIMARY,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: CREAM,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevron: { color: CREAM, fontSize: 16, fontWeight: '700' },
});
