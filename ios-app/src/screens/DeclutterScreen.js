import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import api, { BASE_URL } from '../api';
import { COLORS, FONTS } from '../theme';

export default function DeclutterScreen() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchSuggestions(); }, []);

    const fetchSuggestions = async () => {
        try {
            const res = await api.get('/wardrobe/declutter-suggestions');
            setSuggestions(res.data.suggestions || []);
        } catch (error) {
            console.error(error);
            alert("Could not load declutter suggestions.");
        } finally { setLoading(false); }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.header}>Monica</Text>
            <Text style={styles.intro}>your decluttering bestie</Text>
            <Text style={styles.subtitle}>Pieces you haven't worn lately — maybe someone else would love them?</Text>
            
            {suggestions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🌿</Text>
                    <Text style={styles.emptyText}>Your closet is beautifully curated.</Text>
                    <Text style={styles.emptyHint}>Nothing to declutter right now!</Text>
                </View>
            ) : (
                suggestions.map((item, idx) => {
                    const imageUrl = item.image_path && (item.image_path.startsWith('http') ? item.image_path : `${BASE_URL}/${item.image_path}`);
                    return (
                        <View key={idx} style={styles.card}>
                            {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />}
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle}>{item.color} {item.type}</Text>
                                <Text style={styles.cardReason}>{item.reason}</Text>
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
    content: { padding: 20, paddingBottom: 40 },
    header: { fontSize: 34, fontFamily: FONTS.cursive, color: COLORS.textDark, marginBottom: 2 },
    intro: { fontSize: 14, color: COLORS.textLight, fontStyle: 'italic', letterSpacing: 0.5, marginBottom: 6 },
    subtitle: { fontSize: 15, color: COLORS.textMedium, marginBottom: 24, lineHeight: 22 },
    card: { backgroundColor: COLORS.cardBg, borderRadius: 22, overflow: 'hidden', marginBottom: 16, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 2, borderLeftWidth: 3, borderLeftColor: COLORS.sage },
    image: { width: '100%', height: 200, backgroundColor: COLORS.inputBg },
    cardBody: { padding: 18 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, textTransform: 'capitalize', marginBottom: 8 },
    cardReason: { fontSize: 14, color: COLORS.textMedium, lineHeight: 22 },
    emptyState: { padding: 40, backgroundColor: COLORS.cardBg, borderRadius: 22, alignItems: 'center', shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    emptyEmoji: { fontSize: 40, marginBottom: 12 },
    emptyText: { fontSize: 17, color: COLORS.sage, textAlign: 'center', fontWeight: '600' },
    emptyHint: { fontSize: 13, color: COLORS.textLight, marginTop: 6 }
});
