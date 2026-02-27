import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
    FlatList,
    Vibration,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme, ColorPalette } from "../../src/context/theme";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// Constants
const TICK_SPACING = 12; // wider spacing for cleaner look
const TICK_COUNT = 300; // Enough range
const MIN_WEIGHT = 20; // kg
const MAX_WEIGHT = 250;
const WEIGHT_STEP = 0.1;

interface WeightLogModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSave: (weight: number, unit: "kg" | "lbs") => void;
    initialWeight?: number;
    initialUnit?: "kg" | "lbs";
}

export default function WeightLogModal({
    isVisible,
    onClose,
    onSave,
    initialWeight = 70,
    initialUnit = "kg",
}: WeightLogModalProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const [unit, setUnitState] = useState<"kg" | "lbs">(initialUnit);
    const [weight, setWeight] = useState(initialWeight);

    // Ref for flatlist
    const scrollRef = useRef<FlatList>(null);

    // Constants for Ruler
    // We want 0.1 granularity.
    // Range: MIN to MAX.
    // If unit is LBS, range should probably be higher?
    // Let's keep one internal scale or dynamic?
    // Dynamic is better for UX.
    const isKg = unit === 'kg';
    const MIN_VAL = isKg ? 20 : 44;
    const MAX_VAL = isKg ? 250 : 550;

    // Check if we need to regenerate data on unit change? Yes.
    // Memoize this if it's heavy, but 2-5k items is fine.
    const tickData = React.useMemo(() => {
        const count = Math.floor((MAX_VAL - MIN_VAL) * 10) + 1; // 0.1 steps
        return Array.from({ length: count }, (_, i) => MIN_VAL + (i * 0.1));
    }, [MIN_VAL, MAX_VAL]);

    const colors = {
        overlay: "rgba(0, 0, 0, 0.5)",
        surface: isDarkMode ? selectedPalette.dark.surface : "#FFFFFF",
        text: isDarkMode ? selectedPalette.dark.text : "#000000",
        textSecondary: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
        rulerMark: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
        rulerText: isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
        primary: selectedPalette.primary,
    };

    // Calculate accurate ruler width for centering
    // Screen Width - Overlay Padding (16*2=32)
    // Modal Max Width is 400.
    // Modal Content Padding (24*2=48).
    const overlayPadding = 32;
    const modalPadding = 48;
    const availableWidth = width - overlayPadding;
    const actualModalWidth = Math.min(availableWidth, 400);
    const rulerWidth = actualModalWidth - modalPadding;

    // Padding to center the first item
    const listPadding = (rulerWidth - TICK_SPACING) / 2;

    useEffect(() => {
        if (isVisible) {
            setUnitState(initialUnit);
            setWeight(initialWeight);
        }
    }, [isVisible, initialWeight, initialUnit]);

    // Scroll to weight when it changes (only on mount or unit switch, not user scroll)
    useEffect(() => {
        if (isVisible && scrollRef.current) {
            const index = Math.round((weight - MIN_VAL) * 10);
            if (index >= 0 && index < tickData.length) {
                setTimeout(() => {
                    scrollRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
                }, 0);
            }
        }
    }, [isVisible, unit]); // Depend on unit to re-snap after conversion

    const handleUnitChange = (newUnit: "kg" | "lbs") => {
        if (newUnit === unit) return;

        // Convert logic
        let newWeight = weight;
        if (newUnit === 'kg') {
            // lbs -> kg
            newWeight = weight * 0.453592;
        } else {
            // kg -> lbs
            newWeight = weight * 2.20462;
        }

        // Round to 1 decimal
        newWeight = Math.round(newWeight * 10) / 10;

        setUnitState(newUnit);
        setWeight(newWeight);
        // Effect will handle scrolling
    };

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / TICK_SPACING);
        const val = MIN_VAL + (index * 0.1);

        // Normalize val
        const rounded = Math.round(val * 10) / 10;

        if (rounded !== weight && rounded >= MIN_VAL && rounded <= MAX_VAL) {
            setWeight(rounded);
            if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
            }
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Today's Weight</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Setup Unit Toggle */}
                    <View style={[styles.toggleContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <TouchableOpacity
                            style={[styles.toggleButton, unit === 'kg' && { backgroundColor: selectedPalette.primary }]}
                            onPress={() => handleUnitChange('kg')}
                        >
                            <Text style={[styles.toggleText, { color: unit === 'kg' ? '#FFF' : colors.textSecondary }]}>KG</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, unit === 'lbs' && { backgroundColor: selectedPalette.primary }]}
                            onPress={() => handleUnitChange('lbs')}
                        >
                            <Text style={[styles.toggleText, { color: unit === 'lbs' ? '#FFF' : colors.textSecondary }]}>LBS</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Weight Display */}
                    <View style={styles.valueContainer}>
                        <Text style={[styles.valueText, { color: colors.text }]}>{weight.toFixed(1)}</Text>
                        <Text style={[styles.unitText, { color: colors.primary }]}>{unit.toUpperCase()}</Text>
                    </View>

                    {/* Ruler */}
                    <View style={styles.rulerContainer}>
                        <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
                        <FlatList
                            ref={scrollRef}
                            data={tickData}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={TICK_SPACING}
                            decelerationRate="fast"
                            // keyExtractor is expensive for 2000 items if we stringify float? Use index
                            keyExtractor={(item, index) => index.toString()}
                            onScroll={onScroll}
                            scrollEventThrottle={16}
                            initialNumToRender={20}
                            maxToRenderPerBatch={20}
                            windowSize={5}
                            contentContainerStyle={{ paddingHorizontal: listPadding }}
                            getItemLayout={(data, index) => (
                                { length: TICK_SPACING, offset: TICK_SPACING * index, index }
                            )}
                            renderItem={({ item, index }) => {
                                // item is e.g. 20.0, 20.1 ...
                                // Major tick if integer
                                // But floating point math is tricky: 20.0000001
                                // Check if close to integer
                                const isInteger = Math.abs(item - Math.round(item)) < 0.01;
                                const isHalf = !isInteger && Math.abs((item - 0.5) - Math.round(item - 0.5)) < 0.01;

                                return (
                                    <View style={[styles.tickContainer, { width: TICK_SPACING }]}>
                                        <Text style={[styles.tickLabel, { color: colors.rulerText, opacity: isInteger ? 1 : 0 }]}>
                                            {isInteger ? Math.round(item) : ''}
                                        </Text>
                                        <View style={[
                                            styles.tickMark,
                                            {
                                                height: isInteger ? 24 : (isHalf ? 16 : 8),
                                                backgroundColor: isInteger ? colors.textSecondary : colors.rulerMark,
                                                width: isInteger ? 2 : 1.5
                                            }
                                        ]} />
                                    </View>
                                );
                            }}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                        onPress={() => onSave(weight, unit)}
                    >
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center', // Center title
        alignItems: 'center',
        marginBottom: 24,
        position: 'relative'
    },
    title: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        padding: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 4,
        width: 140,
        marginBottom: 32,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    valueText: {
        fontSize: 64,
        fontFamily: 'Outfit-Bold',
        lineHeight: 70,
    },
    unitText: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        marginLeft: 8,
        marginBottom: 12,
    },
    rulerContainer: {
        height: 100,
        width: '100%',
        marginBottom: 32,
        position: 'relative',
        justifyContent: 'center',
    },
    indicator: {
        position: 'absolute',
        top: 40,
        bottom: 0,
        width: 4,
        borderRadius: 2,
        left: '50%',
        marginLeft: -2,
        zIndex: 10,
        height: 40,
    },
    tickContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
    },
    tickMark: {
        width: 2,
        borderRadius: 1,
        marginBottom: 0,
        backgroundColor: '#E0E0E0', // default
    },
    tickLabel: {
        position: 'absolute',
        bottom: 32, // Clear height of tallest tick (24) + margin
        width: 60,
        textAlign: 'center',
        left: (TICK_SPACING - 60) / 2, // Centered: (12 - 60) / 2 = -24
        fontSize: 14,
        fontFamily: 'Outfit-Medium',
    },
    saveButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
    }

});
