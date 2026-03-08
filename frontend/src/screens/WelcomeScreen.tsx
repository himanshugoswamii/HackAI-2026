import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { CREAM, MAROON, WHITE, TEXT_PRIMARY, TEXT_MUTED, FONT_CURSIVE, BORDER } from '../theme';

const HOMEPAGE_HERO = require('../../assets/homepage-hero.png');

export default function WelcomeScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const cursive = Platform.OS === 'web' ? { fontFamily: `${FONT_CURSIVE}, cursive` } : {};

  return (
    <View style={styles.container}>
      <Image
        source={HOMEPAGE_HERO}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} pointerEvents="none" />
      <View style={styles.doodlesTop} pointerEvents="none">
        <Text style={styles.doodleEmoji}>👠</Text>
        <Text style={[styles.doodleEmoji, styles.doodleSmall]}>☕</Text>
        <Text style={[styles.doodleEmoji, styles.doodleSmall]}>👓</Text>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.doodleRow}>
          <Text style={styles.doodleInline}>👜</Text>
          <Text style={[styles.logo, cursive]}>Neural Threads</Text>
          <Text style={styles.doodleInline}>✨</Text>
        </View>
        <Text style={styles.tagline}>Your style, simplified.</Text>
        <View style={styles.scribble} />
        <Text style={styles.message}>
          Dress with confidence. Let AI help you choose what to wear—and what to let go.
        </Text>
        <Text style={[styles.thatIsAll, cursive]}>That's all.</Text>
      </Animated.View>

      <Animated.View
        style={[styles.footer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.doodlesBottom} pointerEvents="none">
          <Text style={styles.doodleEmoji}>📸</Text>
          <Text style={styles.doodleEmoji}>✨</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AppInfo')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 48,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250, 248, 245, 0.52)',
  },
  doodlesTop: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  doodleEmoji: { fontSize: 26, opacity: 0.82 },
  doodleSmall: { fontSize: 20 },
  content: { alignItems: 'center' },
  doodleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  doodleInline: { fontSize: 22, opacity: 0.88 },
  logo: {
    fontSize: 36,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 17,
    color: TEXT_MUTED,
    fontWeight: '500',
    marginBottom: 20,
  },
  scribble: {
    width: 48,
    height: 2,
    backgroundColor: BORDER,
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    color: TEXT_MUTED,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 320,
  },
  thatIsAll: {
    marginTop: 20,
    fontSize: 18,
    color: TEXT_PRIMARY,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  doodlesBottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
    marginBottom: 16,
  },
  footer: { alignItems: 'center' },
  button: {
    backgroundColor: TEXT_PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: CREAM,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
