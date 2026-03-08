import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import api, { BASE_URL } from '../api';

export default function DeclutterScreen() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            const res = await api.get('/wardrobe/declutter-suggestions');
            setSuggestions(res.data.suggestions || []);
        } catch (error) {
            console.error(error);
            alert("Could not load declutter suggestions.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>Declutter AI</Text>
            <Text style={styles.agentIntro}>📦 Hi I'm Monica, your personal AI decluttering agent</Text>
            <Text style={styles.subtitle}>Identify items you haven't worn and consider donating them.</Text>
            
            {suggestions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Your wardrobe is perfectly optimized! No donations suggested right now.</Text>
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
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, paddingBottom: 40 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
    agentIntro: { fontSize: 15, color: '#6B7280', marginBottom: 6, fontStyle: 'italic' },
    card: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    image: { width: '100%', height: 200, backgroundColor: '#E5E7EB' },
    cardBody: { padding: 16 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', textTransform: 'capitalize', marginBottom: 8 },
    cardReason: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
    emptyState: { padding: 30, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#10B981', textAlign: 'center', fontWeight: '500' }
});
