import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { BASE_URL } from '../api';

export default function ChatbotScreen() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hey there! 👋 I\'m Ralph, your personal fashion chatbot. Ask me anything about fashion, outfits, or styling — or attach a photo and ask "What can I pair with this?"' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachedImage, setAttachedImage] = useState(null);

    const handleAttach = () => {
        Alert.alert(
            "Attach Image",
            "Upload an item to ask what goes with it",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Take Photo", onPress: () => processImage(ImagePicker.launchCameraAsync) },
                { text: "Choose from Gallery", onPress: () => processImage(ImagePicker.launchImageLibraryAsync) }
            ]
        );
    };

    const processImage = async (pickerAction) => {
        let result = await pickerAction({ mediaTypes: ['images'], quality: 0.8 });
        if (!result.canceled) {
            setAttachedImage(result.assets[0].uri);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() && !attachedImage) return;

        const newMessages = [...messages, { role: 'user', content: input.trim(), imageUri: attachedImage }];
        setMessages(newMessages);
        setInput('');
        const currentImage = attachedImage;
        setAttachedImage(null);
        setLoading(true);

        try {
            // If there's an image, we need to upload it first to get an image_path
            let uploadedImagePath = null;
            if (currentImage) {
                const formData = new FormData();
                const fileName = currentImage.split('/').pop() || 'upload.jpg';
                const fileType = currentImage.endsWith('.png') ? 'image/png' : 'image/jpeg';
                formData.append('file', { uri: currentImage, name: fileName, type: fileType });
                
                try {
                    const uploadRes = await api.post('/upload-clothing-image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    uploadedImagePath = uploadRes.data.image_path;
                } catch (err) {
                    console.error("Image upload failed", err);
                }
            }

            const payload = {
                messages: newMessages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content || "Analyze this image.",
                    image_path: m.imageUri ? uploadedImagePath : undefined
                }))
            };
            const res = await api.post('/chatbot/chat', payload);
            setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I am having trouble connecting.' }]);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                {!isUser && <Text style={styles.botEmoji}>🤖</Text>}
                <View style={[styles.messageContent, isUser ? styles.userMessageContent : styles.botMessageContent]}>
                    {item.imageUri && (
                        <Image source={{ uri: item.imageUri }} style={styles.chatImage} />
                    )}
                    {!!item.content && (
                        <Text style={isUser ? styles.userText : styles.botText}>
                            {item.content}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.container}
        >
            <View style={styles.listContainer}>
                <FlatList 
                    data={messages}
                    keyExtractor={(_, idx) => String(idx)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
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
                <TextInput 
                    style={styles.input}
                    placeholder="Ask a fashion question..."
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={sendMessage}
                    placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendText}>Send</Text>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    listContainer: { flex: 1 },
    list: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 20 },
    messageBubble: { flexDirection: 'row', maxWidth: '85%', marginBottom: 12, alignItems: 'flex-end' },
    userBubble: { alignSelf: 'flex-end' },
    botBubble: { alignSelf: 'flex-start' },
    botEmoji: { fontSize: 24, marginRight: 8, marginBottom: 4 },
    messageContent: { padding: 14, borderRadius: 20 },
    userMessageContent: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
    botMessageContent: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
    userText: { color: '#FFFFFF', fontSize: 16 },
    botText: { color: '#111827', fontSize: 16 },
    chatImage: { width: 150, height: 150, borderRadius: 10, marginBottom: 8, backgroundColor: '#E5E7EB' },
    attachmentPreview: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB' },
    previewImage: { width: 60, height: 60, borderRadius: 8 },
    removeAttachment: { position: 'absolute', top: 5, left: 60, backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    removeAttachmentText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E5E7EB', paddingBottom: Platform.OS === 'ios' ? 24 : 12, alignItems: 'center' },
    attachButton: { marginRight: 10, padding: 8 },
    attachIcon: { fontSize: 24 },
    input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 24, paddingHorizontal: 18, fontSize: 16, marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 40, maxHeight: 100, paddingTop: 12, paddingBottom: 12 },
    sendButton: { backgroundColor: '#007AFF', borderRadius: 24, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minHeight: 48 },
    sendText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});
