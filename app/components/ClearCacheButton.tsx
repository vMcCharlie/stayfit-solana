import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomAlert } from "../../src/hooks/useCustomAlert";
import CustomAlert from "../components/CustomAlert";

export default function ClearCacheButton() {
    const { alertProps, showAlert } = useCustomAlert();

    const clearCache = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key =>
                key.includes('routine_cache_') ||
                key.includes('exercise_cache_') ||
                key.includes('cached_workout_routines')
            );

            await AsyncStorage.multiRemove(cacheKeys);
            showAlert(
                'Cache Cleared',
                `Cleared ${cacheKeys.length} cache entries. Please restart the app.`,
                [{ text: 'OK' }]
            );
            console.log('Cleared cache keys:', cacheKeys);
        } catch (error) {
            console.error('Error clearing cache:', error);
            showAlert('Error', 'Failed to clear cache');
        }
    };

    return (
        <>
            <TouchableOpacity style={styles.button} onPress={clearCache}>
                <Text style={styles.buttonText}>Clear Cache</Text>
            </TouchableOpacity>
            <CustomAlert {...alertProps} />
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#FF4444',
        padding: 12,
        borderRadius: 8,
        margin: 16,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
