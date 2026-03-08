import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { BASE_URL } from '../api';
import { COLORS, FONTS } from '../theme';

export default function ChatbotScreen() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hey gorgeous! 👋 I\'m Ralph, your fashion confidant. Ask me anything about style — or snap a pic and ask "What pairs with this?"' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachedImage, setAttachedImage] = useState(null);
    const [wardrobe, setWardrobe] = useState([]);
    const flatListRef = useRef(null);

    // Load wardrobe once so we can show item photos in suggestions
    useEffect(() => {
        api.get('/wardrobe/list').then(res => setWardrobe(res.data || [])).catch(console.error);
    }, []);

    // Strip markdown formatting from Gemini replies
    const stripMarkdown = (text) => {
        if (!text) return '';
        return text
            .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
            .replace(/\*(.+?)\*/g, '$1')         // *italic*
            .replace(/__(.+?)__/g, '$1')         // __bold__
            .replace(/_(.+?)_/g, '$1')           // _italic_
            .replace(/#{1,6}\s?/g, '')           // ### headers
            .replace(/`(.+?)`/g, '$1')           // `code`
            .replace(/~~(.+?)~~/g, '$1')         // ~~strikethrough~~
            .replace(/^\s*[-*+]\s/gm, '• ')      // bullet points → •
            .replace(/^\s*\d+\.\s/gm, '')        // numbered lists
            .trim();
    };

    const handleAttach = () => {
        Alert.alert("Attach a Piece", "Upload an item to style with", [
            { text: "Cancel", style: "cancel" },
            { text: "📸 Camera", onPress: () => launchCamera() },
            { text: "🖼️ Gallery", onPress: () => processImage(ImagePicker.launchImageLibraryAsync) }
        ]);
    };

    const launchCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { alert('Camera permission is needed.'); return; }
        processImage(ImagePicker.launchCameraAsync);
    };

    const processImage = async (pickerAction) => {
        let result = await pickerAction({ mediaTypes: ['images'], quality: 0.8 });
        if (!result.canceled) { setAttachedImage(result.assets[0].uri); }
    };

    // Find wardrobe items mentioned in Ralph's reply
    const findMatchingItems = (text) => {
        if (!text || wardrobe.length === 0) return [];
        const lower = text.toLowerCase();
        const matched = [];
        for (const item of wardrobe) {
            const label = `${item.color} ${item.type}`.toLowerCase();
            // Match if Ralph mentions the color+type combo OR just the type with the color nearby
            if (lower.includes(label) || (lower.includes(item.type.toLowerCase()) && lower.includes(item.color.toLowerCase()))) {
                // Avoid duplicates
                if (!matched.find(m => m.id === item.id)) {
                    matched.push(item);
                }
            }
        }
        return matched;
    };

    const sendMessage = async () => {
        if (!input.trim() && !attachedImage) return;

        // Build the new user message
        const userMsg = { role: 'user', content: input.trim(), imageUri: attachedImage, serverImagePath: null };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        const currentImage = attachedImage;
        setAttachedImage(null);
        setLoading(true);

        try {
            // Upload image if attached — get server path
            let uploadedPath = null;
            if (currentImage) {
                const formData = new FormData();
                const fileName = currentImage.split('/').pop() || 'upload.jpg';
                const fileType = currentImage.endsWith('.png') ? 'image/png' : 'image/jpeg';
                formData.append('file', { uri: currentImage, name: fileName, type: fileType });
                try {
                    const uploadRes = await api.post('/upload-clothing-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    uploadedPath = uploadRes.data.image_path;
                } catch (err) { console.error("Image upload failed", err); }
            }

            // Store the server path on this message so future sends include it correctly
            userMsg.serverImagePath = uploadedPath;
            const messagesWithPaths = updatedMessages.map(m => ({ ...m }));

            // Build payload: each message carries its OWN server image path for context
            const payload = {
                messages: messagesWithPaths.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content || "What do you think of this clothing item?",
                    image_path: m.serverImagePath || undefined
                }))
            };

            const res = await api.post('/chatbot/chat', payload);
            const replyText = res.data.reply;

            // Find wardrobe items mentioned in the reply
            const matchedItems = findMatchingItems(replyText);

            setMessages([...messagesWithPaths, {
                role: 'assistant',
                content: replyText,
                matchedWardrobeItems: matchedItems
            }]);
        } catch (error) {
            console.error(error);
            setMessages([...updatedMessages, { role: 'assistant', content: 'Hmm, I\'m having a moment. Try again?' }]);
        } finally { setLoading(false); }
    };

    const renderItem = ({ item }) => {
        const isUser = item.role === 'user';
        const matchedItems = item.matchedWardrobeItems || [];

        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                {!isUser && <Text style={styles.botEmoji}>💫</Text>}
                <View style={{ maxWidth: '90%' }}>
                    <View style={[styles.messageContent, isUser ? styles.userMessageContent : styles.botMessageContent]}>
                        {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.chatImage} />}
                        {!!item.content && <Text style={isUser ? styles.userText : styles.botText}>{isUser ? item.content : stripMarkdown(item.content)}</Text>}
                    </View>

                    {/* Show matched wardrobe item photos below Ralph's message */}
                    {matchedItems.length > 0 && (
                        <View style={styles.matchedContainer}>
                            <Text style={styles.matchedLabel}>From Your Wardrobe:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {matchedItems.map((wi, idx) => {
                                    const url = wi.image_path && (wi.image_path.startsWith('http') ? wi.image_path : `${BASE_URL}/${wi.image_path}`);
                                    return (
                                        <View key={idx} style={styles.matchedItem}>
                                            {url ? (
                                                <Image source={{ uri: url }} style={styles.matchedImage} />
                                            ) : (
                                                <View style={styles.matchedPlaceholder} />
                                            )}
                                            <Text style={styles.matchedName}>{wi.color} {wi.type}</Text>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={styles.container}>
            <View style={styles.listContainer}>
                <FlatList ref={flatListRef} data={messages} keyExtractor={(_, idx) => String(idx)} renderItem={renderItem}
                    contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} />
            </View>

            {attachedImage && (
                <View style={styles.attachmentPreview}>
                    <Image source={{ uri: attachedImage }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeAttachment} onPress={() => setAttachedImage(null)}>
                        <Text style={styles.removeAttachmentText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.attachButton} onPress={handleAttach}>
                    <Text style={styles.attachIcon}>📷</Text>
                </TouchableOpacity>
                <TextInput style={styles.input} placeholder="Ask Ralph anything..."
                    placeholderTextColor={COLORS.textLight} value={input} onChangeText={setInput}
                    onSubmitEditing={sendMessage} />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading} activeOpacity={0.8}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendText}>→</Text>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    listContainer: { flex: 1 },
    list: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
    messageBubble: { flexDirection: 'row', maxWidth: '85%', marginBottom: 14, alignItems: 'flex-start' },
    userBubble: { alignSelf: 'flex-end' },
    botBubble: { alignSelf: 'flex-start' },
    botEmoji: { fontSize: 20, marginRight: 8, marginTop: 8 },
    messageContent: { padding: 16, borderRadius: 22 },
    userMessageContent: { backgroundColor: COLORS.gold, borderBottomRightRadius: 6 },
    botMessageContent: { backgroundColor: COLORS.cardBg, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: COLORS.border },
    userText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
    botText: { color: COLORS.textDark, fontSize: 15, lineHeight: 22 },
    chatImage: { width: 150, height: 150, borderRadius: 14, marginBottom: 8, backgroundColor: COLORS.inputBg },

    // Matched wardrobe items
    matchedContainer: { marginTop: 8, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.border },
    matchedLabel: { fontSize: 12, color: COLORS.gold, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    matchedItem: { alignItems: 'center', marginRight: 12 },
    matchedImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: COLORS.inputBg },
    matchedPlaceholder: { width: 64, height: 64, borderRadius: 12, backgroundColor: COLORS.inputBg },
    matchedName: { fontSize: 10, color: COLORS.textMedium, textAlign: 'center', marginTop: 4, textTransform: 'capitalize', maxWidth: 70 },

    attachmentPreview: { flexDirection: 'row', padding: 12, backgroundColor: COLORS.cardBg, borderTopWidth: 1, borderColor: COLORS.border },
    previewImage: { width: 56, height: 56, borderRadius: 12 },
    removeAttachment: { position: 'absolute', top: 6, left: 60, backgroundColor: 'rgba(44,36,33,0.5)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    removeAttachmentText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: COLORS.cardBg, borderTopWidth: 0.5, borderColor: COLORS.border, paddingBottom: Platform.OS === 'ios' ? 28 : 12, alignItems: 'center' },
    attachButton: { marginRight: 10, padding: 6 },
    attachIcon: { fontSize: 22 },
    input: { flex: 1, backgroundColor: COLORS.inputBg, borderRadius: 22, paddingHorizontal: 18, fontSize: 15, color: COLORS.textDark, marginRight: 10, borderWidth: 1, borderColor: COLORS.border, minHeight: 44, maxHeight: 100, paddingTop: 12, paddingBottom: 12 },
    sendButton: { backgroundColor: COLORS.gold, borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
    sendText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 20 }
});
