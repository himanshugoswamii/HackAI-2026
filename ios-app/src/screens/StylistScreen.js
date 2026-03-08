import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../api';
import { COLORS, FONTS } from '../theme';

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
        if (!age || !stylePref) { alert("Please enter your age and style preference."); return; }
        setLoading(true);
        try {
            const res = await api.post('/stylist/suggest-outfits', {
                age: parseInt(age), style_preference: stylePref,
                wardrobe_items: wardrobe, inspiration_description: inspiration || null
            });
            setOutfits(res.data.outfits || []);
        } catch (error) { console.error(error); alert("Failed to get suggestions."); }
        finally { setLoading(false); }
    };

    const handleSaveOutfit = async (outfit) => {
        try {
            const itemImages = (outfit.items || []).map(label => {
                const match = wardrobe.find(w => `${w.color} ${w.type}`.toLowerCase() === label.toLowerCase());
                return { label, image_path: match ? match.image_path : null };
            });
            await api.post('/outfits/save', {
                title: outfit.title || 'Saved Outfit', items: outfit.items || [],
                reason: outfit.reason || '', item_images: itemImages
            });
            alert("✨ Outfit saved!");
        } catch (error) { alert("Couldn't save outfit."); }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.header}>Miranda</Text>
            <Text style={styles.subtitle}>your personal AI stylist</Text>
            
            <View style={styles.formCard}>
                <Text style={styles.label}>Style I Love</Text>
                <TextInput style={styles.input} value={stylePref} onChangeText={setStylePref} placeholderTextColor={COLORS.textLight} placeholder="e.g. boho chic, minimalist" />
                <Text style={styles.label}>Inspiration (optional)</Text>
                <TextInput style={styles.input} value={inspiration} onChangeText={setInspiration} placeholderTextColor={COLORS.textLight} placeholder="Describe a look you're dreaming of..." multiline />
                <TouchableOpacity style={styles.button} onPress={handleGetSuggestions} disabled={loading} activeOpacity={0.8}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Style Me ✨</Text>}
                </TouchableOpacity>
            </View>

            {outfits.length > 0 && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsHeader}>Curated For You</Text>
                    {outfits.map((outfit, idx) => (
                        <View key={idx} style={styles.outfitCard}>
                            <Text style={styles.outfitTitle}>{outfit.title}</Text>
                            <Text style={styles.outfitReason}>{outfit.reason}</Text>
                            <View style={styles.itemsContainer}>
                                {(outfit.items || []).map((label, i) => {
                                    const match = wardrobe.find(w => `${w.color} ${w.type}`.toLowerCase() === label.toLowerCase());
                                    const imgUrl = match?.image_path && (match.image_path.startsWith('http') ? match.image_path : `${BASE_URL}/${match.image_path}`);
                                    return imgUrl ? (
                                        <Image key={i} source={{ uri: imgUrl }} style={styles.itemImage} />
                                    ) : (
                                        <View key={i} style={styles.placeholderImage}><Text style={styles.placeholderText}>{label}</Text></View>
                                    );
                                })}
                            </View>
                            <TouchableOpacity style={styles.saveButton} onPress={() => handleSaveOutfit(outfit)} activeOpacity={0.8}>
                                <Text style={styles.saveButtonText}>Save This Look 💾</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 20, paddingBottom: 40 },
    header: { fontSize: 34, fontFamily: FONTS.cursive, color: COLORS.textDark, marginBottom: 2 },
    subtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 24, fontStyle: 'italic', letterSpacing: 0.5 },
    formCard: { backgroundColor: COLORS.cardBg, padding: 22, borderRadius: 22, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 3, marginBottom: 24 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
    input: { backgroundColor: COLORS.inputBg, padding: 16, borderRadius: 14, marginBottom: 18, fontSize: 16, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border },
    button: { backgroundColor: COLORS.gold, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 4, shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    buttonText: { color: '#FFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
    resultsContainer: { marginTop: 8 },
    resultsHeader: { fontSize: 22, fontFamily: FONTS.cursive, marginBottom: 16, color: COLORS.textDark },
    outfitCard: { backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 22, marginBottom: 16, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2, borderLeftWidth: 3, borderLeftColor: COLORS.rose },
    outfitTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: COLORS.textDark },
    outfitReason: { fontSize: 14, color: COLORS.textMedium, marginBottom: 16, lineHeight: 22 },
    itemsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    itemImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: COLORS.inputBg },
    placeholderImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center', padding: 4 },
    placeholderText: { fontSize: 9, textAlign: 'center', color: COLORS.textLight },
    saveButton: { backgroundColor: COLORS.rose, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 },
    saveButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 }
});
