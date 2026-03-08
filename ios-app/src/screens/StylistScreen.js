import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../api';

export default function StylistScreen() {
    const [age, setAge] = useState('');
    const [stylePref, setStylePref] = useState('casual minimal');
    const [inspiration, setInspiration] = useState('');
    const [loading, setLoading] = useState(false);
    const [outfits, setOutfits] = useState([]);
    const [wardrobe, setWardrobe] = useState([]);

    useEffect(() => {
        api.get('/wardrobe/list').then(res => setWardrobe(res.data)).catch(console.error);
        AsyncStorage.getItem('userProfile').then(data => {
            if (data) {
                const profile = JSON.parse(data);
                if (profile.age) setAge(profile.age);
            }
        }).catch(console.error);
    }, []);

    const handleGetSuggestions = async () => {
        if (!age || !stylePref) {
            alert("Please enter your age and style preference.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                age: parseInt(age, 10),
                style_preference: stylePref,
                wardrobe_items: wardrobe,
                inspiration_description: inspiration || null
            };
            const res = await api.post('/stylist/suggest-outfits', payload);
            setOutfits(res.data.outfits || []);
        } catch (error) {
            console.error(error);
            alert("Failed to get suggestions. Make sure you have clothes in your wardrobe.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOutfit = async (outfit) => {
        try {
            const payload = {
                title: outfit.title,
                items: outfit.item_images.map(img => img.label || 'Clothing item'),
                reason: outfit.reason,
                item_images: outfit.item_images
            };
            await api.post('/outfits/save', payload);
            alert("Outfit saved to your Outfits tab!");
        } catch (error) {
            console.error(error);
            alert("Failed to save outfit.");
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>AI Stylist</Text>
            <Text style={styles.subtitle}>✨ Hi I'm Miranda, your personal AI stylist agent</Text>
            
            <View style={styles.formCard}>
                <Text style={styles.label}>Style Preference</Text>
                <TextInput style={styles.input} value={stylePref} onChangeText={setStylePref} placeholder="e.g. Streetwear, Business Casual..." />

                <Text style={styles.label}>Inspiration (Optional)</Text>
                <TextInput style={styles.input} value={inspiration} onChangeText={setInspiration} placeholder="e.g. Going to a dinner date" />

                <TouchableOpacity style={styles.button} onPress={handleGetSuggestions} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Get Outfit Suggestions</Text>}
                </TouchableOpacity>
            </View>

            {outfits.length > 0 && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsHeader}>Suggested Outfits</Text>
                    {outfits.map((outfit, index) => (
                        <View key={index} style={styles.outfitCard}>
                            <Text style={styles.outfitTitle}>{outfit.title}</Text>
                            <Text style={styles.outfitReason}>{outfit.reason}</Text>
                            <View style={styles.itemsContainer}>
                                {outfit.item_images.map((imgItem, i) => {
                                    if (imgItem.image_path) {
                                        const url = imgItem.image_path.startsWith('http') ? imgItem.image_path : `${BASE_URL}/${imgItem.image_path}`;
                                        return <Image key={i} source={{ uri: url }} style={styles.itemImage} />;
                                    }
                                    return <View key={i} style={styles.placeholderImage}><Text style={styles.placeholderText}>{imgItem.label}</Text></View>;
                                })}
                            </View>
                            <TouchableOpacity style={styles.saveButton} onPress={() => handleSaveOutfit(outfit)}>
                                <Text style={styles.saveButtonText}>Save Outfit</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { padding: 20, paddingBottom: 40 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: '#111827' },
    subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 16, fontStyle: 'italic' },
    formCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#F3F4F6', padding: 14, borderRadius: 10, marginBottom: 16, fontSize: 16 },
    button: { backgroundColor: '#000', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    resultsContainer: { marginTop: 10 },
    resultsHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#111827' },
    outfitCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    outfitTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
    outfitReason: { fontSize: 14, color: '#4B5563', marginBottom: 15, lineHeight: 20 },
    itemsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    itemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#E5E7EB' },
    placeholderImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', padding: 4 },
    placeholderText: { fontSize: 10, textAlign: 'center', color: '#9CA3AF' },
    saveButton: { backgroundColor: '#111827', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold' }
});
