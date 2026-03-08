import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { BASE_URL } from '../api';

const { width } = Dimensions.get('window');

// 2 columns
const itemWidth = (width - 60) / 2; 

export default function WardrobeScreen() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWardrobe();
    }, []);

    const fetchWardrobe = async () => {
        try {
            const res = await api.get('/wardrobe/list');
            setItems(res.data);
        } catch (error) {
            console.error(error);
            alert("Could not load wardrobe items.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = () => {
        Alert.alert(
            "Upload to Wardrobe",
            "How would you like to add your clothing item?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Take Photo", onPress: () => processImage(ImagePicker.launchCameraAsync) },
                { text: "Choose from Gallery", onPress: () => processImage(ImagePicker.launchImageLibraryAsync) }
            ]
        );
    };

    const processImage = async (pickerAction) => {
        let result = await pickerAction({
            mediaTypes: ['images'],
            quality: 0.8,
        });

        if (!result.canceled) {
            setLoading(true);
            try {
                const formData = new FormData();
                const imageUri = result.assets[0].uri;
                const fileName = imageUri.split('/').pop() || 'upload.jpg';
                const fileType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
                
                formData.append('file', {
                    uri: imageUri,
                    name: fileName,
                    type: fileType,
                });

                const res = await api.post('/upload-clothing-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                
                if (res.data.classification) {
                    const c = res.data.classification;
                    await api.post('/wardrobe/add', {
                        type: c.type || 'unknown',
                        color: c.color || 'unknown',
                        style: c.style || 'casual',
                        season: c.season || 'all-season',
                        formality: c.formality || 'casual',
                        image_path: res.data.image_path
                    });
                    alert("Item correctly classified & added to Wardrobe!");
                    fetchWardrobe();
                } else {
                    alert("Uploaded successfully, but couldn't classify it.");
                }
            } catch (error) {
                console.error(error);
                alert("Upload failed. Make sure your server is running.");
                setLoading(false);
            }
        }
    };

    const handleDelete = (item) => {
        Alert.alert(
            "Delete Item",
            `Remove this ${item.color} ${item.type} from your wardrobe?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await api.post('/wardrobe/delete', { id: item.id });
                        setItems(prev => prev.filter(i => i.id !== item.id));
                    } catch (error) {
                        console.error(error);
                        alert("Failed to delete item.");
                    }
                }}
            ]
        );
    };

    const renderItem = ({ item }) => {
        const imageUrl = item.image_path.startsWith('http') 
            ? item.image_path 
            : `${BASE_URL}/${item.image_path}`;

        return (
            <View style={styles.card}>
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
                <View style={styles.info}>
                    <Text style={styles.type}>{item.color} {item.type}</Text>
                    <Text style={styles.detail}>{item.style} • {item.season}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Wardrobe</Text>
            {items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Your wardrobe is empty.</Text>
                </View>
            ) : (
                <FlatList 
                    data={items}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
            
            <TouchableOpacity style={styles.fab} onPress={handleUpload}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 28, fontWeight: 'bold', margin: 20, color: '#111827' },
    list: { paddingHorizontal: 15, paddingBottom: 20 },
    card: {
        width: itemWidth,
        margin: 7,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
    },
    image: { width: '100%', height: itemWidth * 1.2, backgroundColor: '#E5E7EB' },
    deleteBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteIcon: { fontSize: 14 },
    info: { padding: 10 },
    type: { fontSize: 14, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
    detail: { fontSize: 12, color: '#6B7280', marginTop: 4, textTransform: 'capitalize' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#6B7280' },
    fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, backgroundColor: '#000', borderRadius: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 5 },
    fabIcon: { fontSize: 32, color: 'white', marginTop: -2 }
});
