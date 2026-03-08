import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Modal,
    Animated,
    TouchableWithoutFeedback,
    ActivityIndicator,
} from "react-native";
import CustomAlert from "./CustomAlert";
import SharePhotoModal from "./SharePhotoModal";
import { Ionicons } from "@expo/vector-icons";
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    getDay,
} from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { useTheme } from "../../src/context/theme";
import { useAuth } from "../../src/context/auth";
import { mintProgressNFT } from "../../src/services/nftService";

interface ProfileCalendarProps {
    userId?: string;
}

interface ProgressPhoto {
    id: string;
    photo_url: string;
    thumbnail_url?: string;
    created_at: string;
    category: string;
    notes?: string;
}

export default function ProfileCalendar({ userId }: ProfileCalendarProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const { user: authUser } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [photos, setPhotos] = useState<{ [key: string]: ProgressPhoto[] }>({});
    const [loading, setLoading] = useState(false);
    const [minting, setMinting] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [viewPhotos, setViewPhotos] = useState<ProgressPhoto[]>([]);
    const [viewIndex, setViewIndex] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const fadeAnim = React.useRef(new Animated.Value(1)).current;
    const insets = useSafeAreaInsets();

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        buttons: { text: string; style?: "default" | "cancel" | "destructive"; onPress?: () => void }[];
    }>({ title: "", message: "", buttons: [] });
    const [shareModalVisible, setShareModalVisible] = useState(false);

    const toggleControls = () => {
        if (controlsVisible) {
            hideControls();
        } else {
            showControls();
        }
    };

    const showControls = () => {
        setControlsVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const hideControls = () => {
        setControlsVisible(false);
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (controlsVisible && viewPhotos.length > 0) {
            timer = setTimeout(() => {
                hideControls();
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [controlsVisible, viewIndex, viewPhotos.length]);

    const handlePreviousPhoto = () => {
        setViewIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : prev; // Don't loop backwards from 0 to end automatically? User said "move next and previous". usually gallery stops or loops. Existing code looped.
            // Requirement: "once the all images of a day ends... goes to the next available day/image"
            // Since we flattened the list, Next just goes next.
            // I'll keep loop behavior or stop? "goes to the next available day" implies continuous flow.
            // If I am at 0, should I go to last? Maybe not.
            return prev > 0 ? prev - 1 : prev;
        });
        showControls(); // Show controls on navigation
    };

    const handleNextPhoto = () => {
        setViewIndex(prev => {
            return prev < viewPhotos.length - 1 ? prev + 1 : prev;
        });
        showControls();
    };

    const colors = {
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        textSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.6)",
        surface: isDarkMode ? selectedPalette.dark.surface : selectedPalette.light.surface,
        surfaceSecondary: isDarkMode
            ? `${selectedPalette.primary}15`
            : `${selectedPalette.primary}10`,
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    };

    const fetchPhotosForMonth = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();

            const { data, error } = await supabase
                .from("progress_photos")
                .select("*")
                .eq("user_id", userId)
                .gte("created_at", start)
                .lte("created_at", end);

            if (error) throw error;

            const photoMap: { [key: string]: ProgressPhoto[] } = {};
            data?.forEach((photo) => {
                const dateKey = format(new Date(photo.created_at), "yyyy-MM-dd");
                if (!photoMap[dateKey]) {
                    photoMap[dateKey] = [];
                }
                photoMap[dateKey].push(photo);
            });

            // Sort photos for each day by time
            Object.keys(photoMap).forEach(key => {
                photoMap[key].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });

            setPhotos(photoMap);
        } catch (error) {
            console.error("Error fetching calendar photos:", error);
        } finally {
            setLoading(false);
        }
    };



    // Helper to extract path from full URL for storage deletion
    const getStoragePath = (url: string) => {
        if (!url) return null;
        // URL format: .../progress-photos/user_id/filename.jpg
        // We need: user_id/filename.jpg
        const parts = url.split('/progress-photos/');
        return parts.length > 1 ? parts[1] : null;
    };

    const handleMintNFT = async (photo: ProgressPhoto) => {
        const walletAddress = authUser?.user_metadata?.wallet_address;
        if (!walletAddress) {
            setAlertConfig({
                title: "Wallet Not Connected",
                message: "Please connect your Solana wallet in the Rewards tab to mint this photo as an NFT.",
                buttons: [{ text: "OK", onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }

        setAlertConfig({
            title: "Mint as NFT",
            message: "Would you like to mint this progress photo as a Solana NFT? This will create a permanent proof of your journey on-chain.",
            buttons: [
                { text: "Cancel", style: "cancel", onPress: () => setAlertVisible(false) },
                {
                    text: "Mint Now",
                    onPress: async () => {
                        setAlertVisible(false);
                        try {
                            setMinting(true);
                            const result = await mintProgressNFT(
                                photo.photo_url,
                                walletAddress,
                                {
                                    name: `StayFit Progress - ${format(new Date(photo.created_at), 'MMM d, yyyy')}`,
                                    description: `On-chain proof of workout progress on StayFit Seeker.`
                                }
                            );

                            if (result.success) {
                                setAlertConfig({
                                    title: "Success",
                                    message: `NFT minted successfully!\n\nMint Address: ${result.mintAddress.slice(0, 8)}...`,
                                    buttons: [{ text: "Awesome!", onPress: () => setAlertVisible(false) }]
                                });
                                setAlertVisible(true);
                            }
                        } catch (err: any) {
                            console.error(err);
                            setAlertConfig({
                                title: "Minting Failed",
                                message: err.message || "Failed to mint NFT. Please try again.",
                                buttons: [{ text: "OK", onPress: () => setAlertVisible(false) }]
                            });
                            setAlertVisible(true);
                        } finally {
                            setMinting(false);
                        }
                    }
                }
            ]
        });
        setAlertVisible(true);
    };

    const handleDeletePhoto = async (photo: ProgressPhoto, index: number) => {
        setAlertConfig({
            title: "Delete Photo",
            message: "Are you sure you want to delete this progress photo? This cannot be undone.",
            buttons: [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => setAlertVisible(false)
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setAlertVisible(false);
                        try {
                            setLoading(true);

                            // 1. Call Edge Function to delete (handles Storage + DB securely)
                            const { error: invokeError } = await supabase.functions.invoke('profile-manager?action=progress-photo', {
                                body: { id: photo.id },
                                method: 'DELETE'
                            });

                            if (invokeError) throw invokeError;

                            const dateKey = format(new Date(photo.created_at), "yyyy-MM-dd");

                            // Remove from viewPhotos
                            const updatedViewPhotos = [...viewPhotos];
                            updatedViewPhotos.splice(index, 1);

                            if (updatedViewPhotos.length === 0) {
                                setViewPhotos([]);
                                setViewIndex(0);
                            } else {
                                setViewPhotos(updatedViewPhotos);
                                if (viewIndex >= updatedViewPhotos.length) {
                                    setViewIndex(updatedViewPhotos.length - 1);
                                }
                            }

                            // Remove from main photos map
                            setPhotos(prev => {
                                const currentDayPhotos = prev[dateKey] || [];
                                const updatedDayPhotos = currentDayPhotos.filter(p => p.id !== photo.id);

                                const newMap = { ...prev };
                                if (updatedDayPhotos.length === 0) {
                                    delete newMap[dateKey];
                                } else {
                                    newMap[dateKey] = updatedDayPhotos;
                                }
                                return newMap;
                            });

                        } catch (error) {
                            console.error("Delete error:", error);
                            // Optional: Show error alert
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        });
        setAlertVisible(true);
    };

    useEffect(() => {
        fetchPhotosForMonth();
    }, [currentDate, userId]);

    const handlePreviousMonth = () => {
        setCurrentDate((prev) => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate((prev) => addMonths(prev, 1));
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    // Calculate padding days for the grid (so starts on correct day of week)
    const startDay = getDay(startOfMonth(currentDate)); // 0 = Sunday
    const paddingDays = Array(startDay).fill(null);

    const allDays = [...paddingDays, ...daysInMonth];

    const renderDay = (date: Date | null, index: number) => {
        if (!date) {
            return (
                <View key={`padding-${index}`} style={styles.dayCell} />
            );
        }

        const dateKey = format(date, "yyyy-MM-dd");
        const dailyPhotos = photos[dateKey];
        const displayPhoto = dailyPhotos ? dailyPhotos[0] : null;
        const isCurrentDay = isToday(date);
        const dayNumber = format(date, "d");

        return (
            <TouchableOpacity
                key={dateKey}
                style={[
                    styles.dayCell,
                    {
                        backgroundColor: isCurrentDay
                            ? `${selectedPalette.primary}20`
                            : "transparent",
                        borderColor: isCurrentDay ? selectedPalette.primary : "transparent",
                        borderWidth: isCurrentDay ? 1 : 0
                    }
                ]}
                onPress={() => {
                    const sortedDates = Object.keys(photos).sort();
                    const allMonthPhotos = sortedDates.flatMap(d => photos[d]);

                    if (dailyPhotos && dailyPhotos.length > 0) {
                        const startId = dailyPhotos[0].id;
                        const startIndex = allMonthPhotos.findIndex(p => p.id === startId);

                        setViewPhotos(allMonthPhotos);
                        setViewIndex(startIndex !== -1 ? startIndex : 0);
                        showControls();
                    }
                    setSelectedDay(date);
                }}
            >
                <View style={[styles.dayContent, { backgroundColor: displayPhoto ? 'transparent' : colors.surfaceSecondary }]}>
                    {displayPhoto ? (
                        <>
                            <Image
                                source={{ uri: displayPhoto.thumbnail_url || displayPhoto.photo_url }}
                                style={styles.dayImage}
                            />
                            <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} />
                            <Text style={[styles.dayText, styles.dayTextWithImage]}>
                                {dayNumber}
                            </Text>
                        </>
                    ) : (
                        <Text style={[styles.dayText, { color: colors.textSecondary }]}>
                            {dayNumber}
                        </Text>
                    )}
                </View>

            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePreviousMonth}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.text }]}>
                    {format(currentDate, "MMMM yyyy")}
                </Text>
                <TouchableOpacity onPress={handleNextMonth}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <Text key={day} style={[styles.weekDayText, { color: colors.textSecondary }]}>
                        {day}
                    </Text>
                ))}
            </View>

            <View style={styles.grid}>
                {allDays.map((day, index) => renderDay(day, index))}
            </View>

            <Modal
                visible={viewPhotos.length > 0}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewPhotos([])}
            >
                <View style={styles.fullScreenContainer}>
                    <TouchableWithoutFeedback onPress={toggleControls}>
                        <View style={StyleSheet.absoluteFill}>
                            {viewPhotos[viewIndex] && (
                                <Image
                                    source={{ uri: viewPhotos[viewIndex].photo_url }}
                                    style={styles.fullScreenImage}
                                    resizeMode="contain"
                                />
                            )}
                        </View>
                    </TouchableWithoutFeedback>

                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            { opacity: fadeAnim },
                            { pointerEvents: controlsVisible ? 'auto' : 'none' }
                        ]}
                    >
                        {/* Top Bar for Actions */}
                        <View style={[styles.topBarContainer, { top: Math.max(insets.top, 20) }]}>
                            <View style={styles.topBarLeft}>
                                {viewPhotos[viewIndex] && (
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => handleDeletePhoto(viewPhotos[viewIndex], viewIndex)}
                                    >
                                        <Ionicons name="trash-outline" size={24} color="#FF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.topBarRight}>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => setShareModalVisible(true)}
                                >
                                    <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => setViewPhotos([])}
                                >
                                    <Ionicons name="close" size={28} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Navigation Arrows */}
                        {viewPhotos.length > 1 && (
                            <>
                                {viewIndex > 0 && (
                                    <TouchableOpacity
                                        style={[styles.navButton, styles.navButtonLeft]}
                                        onPress={handlePreviousPhoto}
                                    >
                                        <Ionicons name="chevron-back" size={36} color="#FFFFFF" />
                                    </TouchableOpacity>
                                )}
                                {viewIndex < viewPhotos.length - 1 && (
                                    <TouchableOpacity
                                        style={[styles.navButton, styles.navButtonRight]}
                                        onPress={handleNextPhoto}
                                    >
                                        <Ionicons name="chevron-forward" size={36} color="#FFFFFF" />
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* Bottom Bar for Info & Minting */}
                        <View style={[styles.bottomBarContainer, { bottom: Math.max(insets.bottom, 40) }]}>
                            {viewPhotos[viewIndex] && (
                                <TouchableOpacity
                                    style={[styles.mintNFTButton, { borderColor: selectedPalette.primary }]}
                                    onPress={() => handleMintNFT(viewPhotos[viewIndex])}
                                    disabled={minting}
                                >
                                    {minting ? (
                                        <View style={styles.mintingContainer}>
                                            <ActivityIndicator size="small" color={selectedPalette.primary} />
                                            <Text style={[styles.mintingText, { color: selectedPalette.primary }]}>Minting...</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <Ionicons name="diamond-outline" size={20} color={selectedPalette.primary} />
                                            <Text style={[styles.mintNFTText, { color: selectedPalette.primary }]}>Mint as NFT</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            {viewPhotos[viewIndex] && (
                                <View style={styles.photoInfoOverlay}>
                                    <Text style={styles.photoInfoText}>
                                        {format(new Date(viewPhotos[viewIndex].created_at), "PPP")}
                                        {(() => {
                                            const photo = viewPhotos[viewIndex];
                                            const dateKey = format(new Date(photo.created_at), "yyyy-MM-dd");
                                            const dayPhotos = photos[dateKey] || [];
                                            const currentIndex = dayPhotos.findIndex(p => p.id === photo.id);
                                            const totalForDay = dayPhotos.length;

                                            if (totalForDay > 1) {
                                                return ` (${currentIndex + 1}/${totalForDay})`;
                                            }
                                            return "";
                                        })()}
                                    </Text>
                                    {viewPhotos[viewIndex].notes ? (
                                        <Text style={styles.photoNotesText}>{viewPhotos[viewIndex].notes}</Text>
                                    ) : null}
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </Modal>


            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />

            <SharePhotoModal
                visible={shareModalVisible}
                photoUrl={viewPhotos[viewIndex]?.photo_url}
                photoDate={viewPhotos[viewIndex]?.created_at}
                onClose={() => setShareModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginBottom: 24,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    monthTitle: {
        fontSize: 18,
        fontFamily: "Outfit-Bold",
    },
    weekHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    weekDayText: {
        width: `${100 / 7}%`,
        textAlign: "center",
        fontSize: 12,
        fontFamily: "Outfit-Medium",
        textTransform: "uppercase",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        // marginHorizontal: -4, // Counteract cell padding/gap if needed
    },
    dayCell: {
        width: `${100 / 7}%`, // 7 days in a row
        aspectRatio: 1, // Square cells
        padding: 2,
        borderRadius: 8,
    },
    dayContent: {
        flex: 1,
        borderRadius: 6,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayImage: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    dayText: {
        fontSize: 14,
        fontFamily: "Outfit-Medium",
    },
    dayTextWithImage: {
        color: "#FFFFFF",
        fontWeight: "bold",
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    fullScreenContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.95)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullScreenImage: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height * 0.8,
    },
    navButton: {
        position: "absolute",
        top: "50%",
        zIndex: 20,
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 30,
    },
    navButtonLeft: {
        left: 20,
    },
    navButtonRight: {
        right: 20,
    },
    topBarContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        zIndex: 10,
    },
    topBarLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    topBarRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    iconButton: {
        padding: 8,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    bottomBarContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        paddingHorizontal: 20,
        zIndex: 10,
    },
    photoInfoOverlay: {
        alignItems: "center",
        marginTop: 16,
    },
    photoInfoText: {
        color: "#FFFFFF",
        fontFamily: "Outfit-Bold",
        fontSize: 18,
        marginBottom: 8,
    },
    photoNotesText: {
        color: "rgba(255,255,255,0.8)",
        fontFamily: "Outfit-Regular",
        fontSize: 16,
        textAlign: "center",
    },
    mintNFTButton: {
        backgroundColor: "rgba(0,0,0,0.8)",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
    },
    mintNFTText: {
        fontFamily: "Outfit-Bold",
        fontSize: 14,
        marginLeft: 8,
    },
    mintingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    mintingText: {
        color: "#FFF",
        fontFamily: "Outfit-Medium",
        fontSize: 14,
        marginLeft: 8,
    },
});
