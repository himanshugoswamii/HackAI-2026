import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import api, { BASE_URL } from '../api';
import { COLORS, FONTS } from '../theme';

export default function OutfitsScreen() {
    const [outfits, setOutfits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOutfits(); }, []);

    const fetchOutfits = async () => {
        try {
            const res = await api.get('/outfits/list');
            setOutfits(res.data.outfits || []);
        } catch (error) {
            console.error(error); alert("Could not load saved outfits.");
        } finally { setLoading(false); }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.title}</Text>
                {item.created_at ? <Text style={styles.timestamp}>🕐 {formatDate(item.created_at)}</Text> : null}
            </View>
            {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}
            <View style={styles.imagesContainer}>
                {item.item_images && item.item_images.map((img, idx) => {
                    const url = img.image_path && (img.image_path.startsWith('http') ? img.image_path : `${BASE_URL}/${img.image_path}`);
                    return url ? (
                        <Image key={idx} source={{ uri: url }} style={styles.image} />
                    ) : (
                        <View key={idx} style={styles.placeholder}><Text style={styles.placeholderText}>{img.label}</Text></View>
                    );
                })}
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Looks</Text>
            <Text style={styles.subtitle}>Outfits saved for the perfect moment</Text>
            {outfits.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>👗</Text>
                    <Text style={styles.emptyText}>No saved looks yet.</Text>
                    <Text style={styles.emptyHint}>Ask Miranda for suggestions, then save your favorites!</Text>
                </View>
            ) : (
                <FlatList
                    data={outfits} keyExtractor={item => String(item.id)}
                    renderItem={renderItem} contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
    header: { fontSize: 30, fontFamily: FONTS.cursive, margin: 20, marginBottom: 2, color: COLORS.textDark },
    subtitle: { fontSize: 13, color: COLORS.textLight, marginLeft: 20, marginBottom: 16, letterSpacing: 0.5 },
    list: { paddingHorizontal: 16, paddingBottom: 30 },
    card: { backgroundColor: COLORS.cardBg, padding: 18, borderRadius: 22, marginBottom: 14, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 2, borderLeftWidth: 3, borderLeftColor: COLORS.lavender },
    cardHeader: { marginBottom: 8 },
    title: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
    timestamp: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
    reason: { fontSize: 14, color: COLORS.textMedium, marginBottom: 12, lineHeight: 22 },
    imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    image: { width: 64, height: 64, borderRadius: 12, backgroundColor: COLORS.inputBg },
    placeholder: { width: 64, height: 64, borderRadius: 12, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center', padding: 4 },
    placeholderText: { fontSize: 9, textAlign: 'center', color: COLORS.textLight },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 17, color: COLORS.textMedium, fontWeight: '500' },
    emptyHint: { fontSize: 13, color: COLORS.textLight, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }
});
