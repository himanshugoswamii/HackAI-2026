import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { BASE_URL } from '../api';
import { COLORS, FONTS } from '../theme';

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2; 

export default function WardrobeScreen() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchWardrobe(); }, []);

    const fetchWardrobe = async () => {
        try {
            const res = await api.get('/wardrobe/list');
            setItems(res.data);
        } catch (error) {
            console.error(error);
            alert("Could not load wardrobe items.");
        } finally { setLoading(false); }
    };

    const handleUpload = () => {
        Alert.alert("Add to Wardrobe", "How would you like to add your piece?", [
            { text: "Cancel", style: "cancel" },
            { text: "📸 Camera", onPress: () => launchCamera() },
            { text: "🖼️ Gallery", onPress: () => processImage(ImagePicker.launchImageLibraryAsync) }
        ]);
    };

    const launchCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Camera permission is needed to take photos.');
            return;
        }
        processImage(ImagePicker.launchCameraAsync);
    };

    const processImage = async (pickerAction) => {
        let result = await pickerAction({ mediaTypes: ['images'], quality: 0.8 });
        if (!result.canceled) {
            setLoading(true);
            try {
                const formData = new FormData();
                const imageUri = result.assets[0].uri;
                const fileName = imageUri.split('/').pop() || 'upload.jpg';
                const fileType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
                formData.append('file', { uri: imageUri, name: fileName, type: fileType });
                const res = await api.post('/upload-clothing-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (res.data.classification) {
                    const c = res.data.classification;
                    await api.post('/wardrobe/add', {
                        type: c.type || 'unknown', color: c.color || 'unknown',
                        style: c.style || 'casual', season: c.season || 'all-season',
                        formality: c.formality || 'casual', image_path: res.data.image_path
                    });
                    alert("✨ Item added to your wardrobe!");
                    fetchWardrobe();
                } else { alert("Uploaded but couldn't classify."); }
            } catch (error) {
                console.error(error);
                alert("Upload failed. Is the server running?");
                setLoading(false);
            }
        }
    };

    const handleDelete = (item) => {
        Alert.alert("Remove Item", `Remove this ${item.color} ${item.type}?`, [
            { text: "Keep", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: async () => {
                try {
                    await api.post('/wardrobe/delete', { id: item.id });
                    setItems(prev => prev.filter(i => i.id !== item.id));
                } catch (error) { alert("Failed to delete."); }
            }}
        ]);
    };

    const renderItem = ({ item }) => {
        const imageUrl = item.image_path.startsWith('http') ? item.image_path : `${BASE_URL}/${item.image_path}`;
        return (
            <View style={styles.card}>
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
                <View style={styles.info}>
                    <Text style={styles.type}>{item.color} {item.type}</Text>
                    <Text style={styles.detail}>{item.style} · {item.season}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Closet</Text>
            <Text style={styles.subtitle}>{items.length} pieces curated with love</Text>
            {items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>👗</Text>
                    <Text style={styles.emptyText}>Your wardrobe is waiting to be filled.</Text>
                    <Text style={styles.emptyHint}>Tap + to add your first piece</Text>
                </View>
            ) : (
                <FlatList 
                    data={items} keyExtractor={item => String(item.id)}
                    renderItem={renderItem} numColumns={2}
                    contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
                />
            )}
            <TouchableOpacity style={styles.fab} onPress={handleUpload} activeOpacity={0.85}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
    header: { fontSize: 30, fontFamily: FONTS.cursive, margin: 20, marginBottom: 2, color: COLORS.textDark },
    subtitle: { fontSize: 13, color: COLORS.textLight, marginLeft: 20, marginBottom: 16, letterSpacing: 0.5 },
    list: { paddingHorizontal: 15, paddingBottom: 100 },
    card: {
        width: itemWidth, margin: 7, backgroundColor: COLORS.cardBg, borderRadius: 18,
        overflow: 'hidden', position: 'relative',
        shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 3,
    },
    image: { width: '100%', height: itemWidth * 1.3, backgroundColor: COLORS.inputBg },
    deleteBtn: {
        position: 'absolute', top: 10, right: 10,
        backgroundColor: 'rgba(44,36,33,0.45)', borderRadius: 14,
        width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
    },
    deleteIcon: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
    info: { padding: 12 },
    type: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, textTransform: 'capitalize' },
    detail: { fontSize: 12, color: COLORS.textLight, marginTop: 3, textTransform: 'capitalize' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 17, color: COLORS.textMedium, fontWeight: '500' },
    emptyHint: { fontSize: 13, color: COLORS.textLight, marginTop: 6 },
    fab: {
        position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
        right: 24, bottom: 30, backgroundColor: COLORS.gold, borderRadius: 30,
        shadowColor: COLORS.gold, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
    },
    fabIcon: { fontSize: 30, color: '#FFF', fontWeight: '300', marginTop: -1 }
});
