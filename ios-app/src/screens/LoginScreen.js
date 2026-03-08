import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../theme';

export default function LoginScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');

    useEffect(() => {
        const checkLogin = async () => {
            const storedProfile = await AsyncStorage.getItem('userProfile');
            if (storedProfile) {
                navigation.replace('Main');
            }
        };
        checkLogin();
    }, []);

    const handleLogin = async () => {
        if (name && email && age) {
            await AsyncStorage.setItem('userProfile', JSON.stringify({ name, email, age }));
            navigation.replace('Main');
        } else {
            alert("Please enter name, email, and age to continue.");
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Text style={styles.sparkle}>✨</Text>
            <Text style={styles.title}>Neural Threads</Text>
            <Text style={styles.subtitle}>Your wardrobe, reimagined</Text>
            
            <View style={styles.form}>
                <TextInput 
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor={COLORS.textLight}
                    value={name}
                    onChangeText={setName}
                />
                <TextInput 
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput 
                    style={styles.input}
                    placeholder="Age"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                />
                <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Step Into Style</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>Miranda · Monica · Ralph await you</Text>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
        backgroundColor: COLORS.bg,
    },
    sparkle: {
        fontSize: 40,
        textAlign: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 38,
        fontFamily: FONTS.cursive,
        textAlign: 'center',
        color: COLORS.textDark,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: COLORS.textMedium,
        marginBottom: 40,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    form: {
        backgroundColor: COLORS.cardBg,
        padding: 24,
        borderRadius: 24,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 4,
    },
    input: {
        backgroundColor: COLORS.inputBg,
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 14,
        fontSize: 16,
        color: COLORS.textDark,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    button: {
        backgroundColor: COLORS.gold,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 6,
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        textAlign: 'center',
        color: COLORS.textLight,
        fontSize: 13,
        marginTop: 30,
        letterSpacing: 0.5,
    }
});
