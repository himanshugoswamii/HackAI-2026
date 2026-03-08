import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import api, { BASE_URL } from '../api';

export default function OutfitsScreen() {
    const [outfits, setOutfits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOutfits();
    }, []);

    const fetchOutfits = async () => {
        try {
            const res = await api.get('/outfits/list');
            setOutfits(res.data.outfits || []);
        } catch (error) {
            console.error(error);
            alert("Could not load saved outfits.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return d.toLocaleDateString(undefined, options);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.title}</Text>
                {item.created_at ? (
                    <Text style={styles.timestamp}>🕐 {formatDate(item.created_at)}</Text>
                ) : null}
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
        return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Saved Outfits</Text>
            {outfits.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>You haven't saved any outfits yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={outfits}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', margin: 20, color: '#111827' },
    list: { paddingHorizontal: 15, paddingBottom: 20 },
    card: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeader: { marginBottom: 6 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    timestamp: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    reason: { fontSize: 14, color: '#4B5563', marginBottom: 12 },
    imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    image: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#E5E7EB' },
    placeholder: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', padding: 4 },
    placeholderText: { fontSize: 10, textAlign: 'center', color: '#9CA3AF' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 16, color: '#6B7280' }
});
