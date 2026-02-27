import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SendIcon, FilterIcon, PlusIcon } from "./TabIcons";
import { useTheme } from "../../src/context/theme";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Animated as RNAnimated, Easing } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../src/lib/supabase";
import DataToBeSentToAI, {
    DataOption,
    DATA_OPTIONS,
} from "./datatobesenttoai";
import ScreenHeader from "./ScreenHeader";

interface Message {
    id: string;
    text: string;
    sender: "user" | "ai";
    timestamp: Date;
    isStreaming?: boolean;
    isTyping?: boolean;
}

import CustomAlert, { AlertButton } from "./CustomAlert";
import { api } from "../../src/services/api"; // Import centralized API

const TypingIndicator = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const [dots, setDots] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const dotAnimation = useRef(new RNAnimated.Value(0)).current;
    const fadeAnimation = useRef(new RNAnimated.Value(1)).current;
    const streamRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const thinkingMessages = [
        "StayFit AI is thinking",
        "Evaluating your request",
        "Processing fitness data",
        "Analyzing workout patterns",
        "Preparing response",
    ];

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 6;

        const animateDots = () => {
            RNAnimated.sequence([
                RNAnimated.timing(dotAnimation, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(dotAnimation, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setDots((prev) => (prev + 1) % 4);
                animateDots();
            });
        };

        const streamText = (text: string) => {
            let currentIndex = 0;
            if (streamRef.current) {
                clearInterval(streamRef.current);
            }

            streamRef.current = setInterval(() => {
                if (currentIndex < text.length) {
                    setCurrentText(text.substring(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    if (streamRef.current) {
                        clearInterval(streamRef.current);
                    }
                }
            }, 20) as unknown as NodeJS.Timeout;
        };

        const changeMessage = () => {
            RNAnimated.sequence([
                RNAnimated.timing(fadeAnimation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(fadeAnimation, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            const nextIndex = (messageIndex + 1) % thinkingMessages.length;
            setMessageIndex(nextIndex);
            streamText(thinkingMessages[nextIndex]);
            retryCount++;

            if (retryCount >= maxRetries) {
                retryCount = 0;
                setMessageIndex(0);
                streamText(thinkingMessages[0]);
            }
        };

        const scheduleNextChange = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            const currentIndex = messageIndex;
            let delay;

            // Set specific delays based on the current message index
            switch (currentIndex) {
                case 0: // First message -> Second message
                    delay = 3000; // 3 seconds
                    break;
                case 1: // Second message -> Third message
                    delay = 2000; // 2 seconds
                    break;
                case 2: // Third message -> Fourth message
                    delay = 2000; // 2 seconds
                    break;
                case 3: // Fourth message -> Fifth message
                    delay = 3000; // 3 seconds
                    break;
                default:
                    delay = 3000; // Reset to first message
            }

            timeoutRef.current = setTimeout(() => {
                changeMessage();
                scheduleNextChange();
            }, delay) as unknown as NodeJS.Timeout;
        };

        // Initial setup
        streamText(thinkingMessages[0]);
        animateDots();
        scheduleNextChange();

        return () => {
            dotAnimation.stopAnimation();
            fadeAnimation.stopAnimation();
            if (streamRef.current) clearInterval(streamRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <View
            style={[
                styles.typingContainer,
                { backgroundColor: isDarkMode ? "#2D2D2D" : "#F5F5F5" },
            ]}
        >
            <RNAnimated.View style={{ opacity: fadeAnimation }}>
                <Text
                    style={[
                        styles.typingText,
                        { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                >
                    {currentText}
                </Text>
            </RNAnimated.View>
            <RNAnimated.View
                style={[styles.dotsContainer, { opacity: dotAnimation }]}
            >
                <Text
                    style={[
                        styles.typingText,
                        { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                >
                    {".".repeat(dots)}
                </Text>
            </RNAnimated.View>
        </View>
    );
};

const SimpleMarkdown = ({ text, style }: { text: string; style: any }) => {
    const renderText = (text: string) => {
        // Split text into segments based on markdown patterns
        const segments = text.split(/(\`[^\`]+\`|\*\*[^\*]+\*\*|\*[^\*]+\*)/g);

        return segments.map((segment, index) => {
            if (segment.startsWith("`") && segment.endsWith("`")) {
                // Code
                return (
                    <Text
                        key={index}
                        style={[
                            style,
                            {
                                fontFamily: "Outfit-Medium",
                                backgroundColor: style.codeBackground,
                                borderRadius: 4,
                                paddingHorizontal: 4,
                                color: style.codeColor,
                            },
                        ]}
                    >
                        {segment.slice(1, -1)}
                    </Text>
                );
            } else if (segment.startsWith("**") && segment.endsWith("**")) {
                // Bold
                return (
                    <Text
                        key={index}
                        style={[
                            style,
                            {
                                fontFamily: "Outfit-Bold",
                            },
                        ]}
                    >
                        {segment.slice(2, -2)}
                    </Text>
                );
            } else if (segment.startsWith("*") && segment.endsWith("*")) {
                // Italic
                return (
                    <Text
                        key={index}
                        style={[
                            style,
                            {
                                fontFamily: "italic",
                            },
                        ]}
                    >
                        {segment.slice(1, -1)}
                    </Text>
                );
            }
            // Plain text
            return segment ? (
                <Text key={index} style={style}>
                    {segment}
                </Text>
            ) : null;
        });
    };

    return <Text>{renderText(text)}</Text>;
};

export default function AIChat() {
    const { isDarkMode, selectedPalette } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);
    const streamingMessageRef = useRef<Message | null>(null);
    const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const contentHeightRef = useRef(0);
    const scrollViewHeightRef = useRef(0);

    const [showDataModal, setShowDataModal] = useState(false);
    const [selectedDataOptions, setSelectedDataOptions] = useState<string[]>([]);


    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons?: AlertButton[];
    }>({
        visible: false,
        title: "",
        message: "",
    });

    const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            buttons,
        });
    };

    const closeAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    // Load chat history from local storage
    useEffect(() => {
        const loadChatHistory = async () => {
            try {
                const savedMessages = await AsyncStorage.getItem("chatHistory");
                if (savedMessages) {
                    const parsedMessages = JSON.parse(savedMessages);
                    // Convert string timestamps back to Date objects
                    const messagesWithDates = parsedMessages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                    }));
                    setMessages(messagesWithDates);
                }
            } catch (error) {
                console.error("Error loading chat history:", error);
            }
        };

        loadChatHistory();
    }, []);

    // Save chat history to local storage whenever messages change
    useEffect(() => {
        const saveChatHistory = async () => {
            try {
                await AsyncStorage.setItem("chatHistory", JSON.stringify(messages));
            } catch (error) {
                console.error("Error saving chat history:", error);
            }
        };

        if (messages.length > 0) {
            saveChatHistory();
        }
    }, [messages]);

    // Load saved data options
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load saved data options
                const savedOptions = await AsyncStorage.getItem("aiDataOptions");
                if (savedOptions) {
                    const options: DataOption[] = JSON.parse(savedOptions);
                    setSelectedDataOptions(
                        options.filter((opt) => opt.enabled).map((opt) => opt.id)
                    );
                } else {
                    // Default to all options enabled
                    setSelectedDataOptions(DATA_OPTIONS.map((opt) => opt.id));
                    // Save default options
                    await AsyncStorage.setItem(
                        "aiDataOptions",
                        JSON.stringify(DATA_OPTIONS)
                    );
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            }
        };

        loadInitialData();
    }, []);

    const handleResetChat = () => {
        setShowResetModal(true);
    };

    const handleConfirmReset = async () => {
        try {
            // Clear all cached data
            await AsyncStorage.removeItem("chatHistory");
            setMessages([]);

            setShowResetModal(false);
            setIsLoading(true);
            setIsLoading(false);
        } catch (error) {
            console.error("Error clearing chat history:", error);
            setIsLoading(false);
        }
    };

    const colors = {
        background: isDarkMode
            ? selectedPalette.dark.background
            : selectedPalette.light.background,
        surface: isDarkMode
            ? selectedPalette.dark.surface
            : selectedPalette.light.surface,
        surfaceSecondary: isDarkMode
            ? `${selectedPalette.primary}15`
            : `${selectedPalette.primary}10`,
        text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
        textSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.6)",
        border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        codeBackground: isDarkMode ? "#2D2D2D" : "#F5F5F5",
    };

    const stopStreaming = () => {
        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
        }
        setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
                lastMessage.isStreaming = false;
            }
            return [...newMessages];
        });
        setIsLoading(false);
    };

    const streamResponse = (text: string) => {
        let currentIndex = 0;
        streamingIntervalRef.current = setInterval(() => {
            if (currentIndex < text.length) {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.isStreaming) {
                        lastMessage.text = text.substring(0, currentIndex + 1);
                        return [...newMessages];
                    }
                    return prev;
                });
                currentIndex++;
            } else {
                stopStreaming();
            }
        }, 5) as unknown as NodeJS.Timeout;
    };

    // Handle scroll events
    const handleScroll = (event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isNearBottom =
            contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;

        setShowScrollToBottom(!isNearBottom);

        // If user scrolls up, disable auto-scrolling
        if (!isNearBottom) {
            setIsAutoScrolling(false);
        }
    };

    // Handle content size changes
    const handleContentSizeChange = (
        contentWidth: number,
        contentHeight: number
    ) => {
        contentHeightRef.current = contentHeight;
        if (isAutoScrolling) {
            scrollToBottom();
        }
    };

    // Handle layout changes
    const handleLayout = (event: any) => {
        const { height } = event.nativeEvent.layout;
        scrollViewHeightRef.current = height;
        if (isAutoScrolling) {
            scrollToBottom();
        }
    };

    // Scroll to bottom function
    const scrollToBottom = () => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    };

    // Reset auto-scrolling when new message is added
    useEffect(() => {
        if (isAutoScrolling) {
            scrollToBottom();
        }
    }, [messages]);

    const handleSend = async () => {
        if (inputText.trim() && !isLoading) {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: inputText.trim(),
                sender: "user",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, newMessage]);
            setInputText("");
            setIsLoading(true);
            setIsAutoScrolling(true);
            streamingMessageRef.current = null; // Reset streaming ref to show typing indicator
            Keyboard.dismiss();

            try {
                // Get enabled data options
                const enabledOptionsStr = await AsyncStorage.getItem("aiDataOptions");
                const aiDataOptions = enabledOptionsStr ? JSON.parse(enabledOptionsStr) : [];
                const enabledOptions = aiDataOptions
                    .filter((opt: any) => opt.enabled)
                    .map((opt: any) => opt.id);

                // Call the API service
                const response = await api.sendMessage(newMessage.text, enabledOptions);
                const aiResponseText = response.text || "I apologize, but I couldn't generate a response.";

                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        text: aiResponseText,
                        sender: "ai",
                        timestamp: new Date(),
                        isStreaming: true, // Reuse existing streaming logic for effect
                    },
                ]);
                streamResponse(aiResponseText);

            } catch (error) {
                console.error("Error generating response:", error);
                showAlert("Error", "Failed to generate response. Please try again.");
                setIsLoading(false);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        text: "I apologize, but I encountered an error. Please try again.",
                        sender: "ai",
                        timestamp: new Date(),
                        isStreaming: false,
                    },
                ]);
            }
        }
    };

    // Update the handleDataOptionsSave function
    const handleDataOptionsSave = async () => {
        try {
            const savedOptions = await AsyncStorage.getItem("aiDataOptions");
            if (savedOptions) {
                const options: DataOption[] = JSON.parse(savedOptions);
                const newSelectedOptions = options
                    .filter((opt: any) => opt.enabled)
                    .map((opt: any) => opt.id);
                setSelectedDataOptions(newSelectedOptions);
            }
        } catch (error) {
            console.error("Error handling data options save:", error);
        }
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top']}
        >
            {/* Header */}
            <ScreenHeader
                title="Stay Fit AI Coach"
                rightAction={
                    <>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => setShowDataModal(true)}
                        >
                            <FilterIcon size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleResetChat}
                        >
                            <PlusIcon size={24} color={colors.text} />
                        </TouchableOpacity>
                    </>
                }
            />

            {/* Reset Chat Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showResetModal}
                onRequestClose={() => setShowResetModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowResetModal(false)}
                >
                    <View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: isDarkMode
                                    ? selectedPalette.dark.surface
                                    : selectedPalette.light.surface,
                                borderColor: isDarkMode
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.1)",
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.modalTitle,
                                {
                                    color: isDarkMode
                                        ? selectedPalette.dark.text
                                        : selectedPalette.light.text,
                                },
                            ]}
                        >
                            Start a New Chat
                        </Text>
                        <Text
                            style={[
                                styles.modalMessage,
                                {
                                    color: isDarkMode
                                        ? selectedPalette.dark.text
                                        : selectedPalette.light.text,
                                },
                            ]}
                        >
                            Are you sure you want to start a new conversation? Your current
                            chat history will be permanently deleted.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                    {
                                        borderColor: isDarkMode
                                            ? "rgba(255,255,255,0.1)"
                                            : "rgba(0,0,0,0.1)",
                                    },
                                ]}
                                onPress={() => setShowResetModal(false)}
                            >
                                <Text
                                    style={[
                                        styles.modalButtonText,
                                        {
                                            color: isDarkMode
                                                ? selectedPalette.dark.text
                                                : selectedPalette.light.text,
                                        },
                                    ]}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: selectedPalette.primary },
                                ]}
                                onPress={handleConfirmReset}
                            >
                                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
                                    Start New
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* Data Selection Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={showDataModal}
                onRequestClose={() => setShowDataModal(false)}
            >
                <DataToBeSentToAI
                    onClose={() => {
                        setShowDataModal(false);
                    }}
                    onSave={handleDataOptionsSave}
                />
            </Modal>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 110 : 0}
            >
                <View style={styles.messagesWrapper}>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        onScroll={handleScroll}
                        onContentSizeChange={handleContentSizeChange}
                        onLayout={handleLayout}
                        scrollEventThrottle={16}
                    >
                        {messages.length === 0 && !isLoading ? (
                            <Animated.View
                                entering={FadeInDown.duration(300)}
                                style={styles.emptyState}
                            >
                                <Ionicons
                                    name="chatbubble-ellipses-outline"
                                    size={48}
                                    color={colors.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.emptyStateText,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    No messages yet
                                </Text>
                                <Text
                                    style={[
                                        styles.emptyStateSubtext,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    Start a conversation with your AI fitness assistant
                                </Text>
                            </Animated.View>
                        ) : (
                            <>
                                {messages.map((message) => (
                                    <View
                                        key={message.id}
                                        style={[
                                            styles.messageBubble,
                                            message.sender === "user"
                                                ? styles.userMessage
                                                : styles.aiMessage,
                                            {
                                                backgroundColor:
                                                    message.sender === "user"
                                                        ? selectedPalette.primary
                                                        : isDarkMode
                                                            ? "#2D2D2D"
                                                            : "#F5F5F5",
                                            },
                                        ]}
                                    >
                                        {message.sender === "ai" ? (
                                            <SimpleMarkdown
                                                text={message.text}
                                                style={{
                                                    color: colors.text,
                                                    fontSize: 16,
                                                    fontFamily: "Outfit-Regular",
                                                    codeBackground: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                                                    codeColor: selectedPalette.primary,
                                                }}
                                            />
                                        ) : (
                                            <Text
                                                style={[
                                                    styles.messageText,
                                                    {
                                                        color:
                                                            message.sender === "user"
                                                                ? "#FFFFFF"
                                                                : colors.text,
                                                    },
                                                ]}
                                            >
                                                {message.text}
                                            </Text>
                                        )}
                                        <Text
                                            style={[
                                                styles.timestamp,
                                                {
                                                    color:
                                                        message.sender === "user"
                                                            ? "rgba(255,255,255,0.7)"
                                                            : colors.textSecondary,
                                                },
                                            ]}
                                        >
                                            {message.timestamp.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                ))}
                                {isLoading && !streamingMessageRef.current && (
                                    <TypingIndicator isDarkMode={isDarkMode} />
                                )}
                            </>
                        )}
                    </ScrollView>

                    {/* Scroll to bottom button */}
                    {showScrollToBottom && (
                        <TouchableOpacity
                            style={[
                                styles.scrollToBottomButton,
                                {
                                    backgroundColor: selectedPalette.primary,
                                },
                            ]}
                            onPress={() => {
                                scrollToBottom();
                                setIsAutoScrolling(true);
                            }}
                        >
                            <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>

                <View
                    style={[
                        styles.inputContainer,
                        {
                            backgroundColor: isDarkMode ? "#2D2D2D" : "#F5F5F5",
                            borderTopColor: colors.border,
                        },
                    ]}
                >
                    <TextInput
                        style={[
                            styles.input,
                            {
                                color: colors.text,
                                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                            },
                        ]}
                        placeholder="Ask anything about fitness..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            {
                                backgroundColor: selectedPalette.primary,
                                opacity: 1,
                            },
                        ]}
                        onPress={isLoading ? stopStreaming : handleSend}
                        disabled={isLoading && !streamingMessageRef.current}
                    >
                        {isLoading ? (
                            <Ionicons name="stop-circle-outline" size={24} color="#FFFFFF" />
                        ) : (
                            <SendIcon size={24} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={closeAlert}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    logo: {
        width: 28,
        height: 28,
        resizeMode: "contain",
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    messagesWrapper: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: 18,
        fontFamily: "Outfit-Medium",
    },
    emptyStateSubtext: {
        marginTop: 8,
        fontSize: 14,
        fontFamily: "Outfit-Regular",
        textAlign: "center",
        paddingHorizontal: 32,
    },
    messageBubble: {
        maxWidth: "80%",
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    userMessage: {
        alignSelf: "flex-end",
        borderBottomRightRadius: 0,
    },
    aiMessage: {
        alignSelf: "flex-start",
        borderBottomLeftRadius: 0,
    },
    messageText: {
        fontSize: 16,
        fontFamily: "Outfit-Regular",
    },
    timestamp: {
        fontSize: 12,
        fontFamily: "Outfit-Regular",
        marginTop: 4,
        alignSelf: "flex-end",
    },
    inputContainer: {
        flexDirection: "row",
        padding: 16,
        borderTopWidth: 1,
        alignItems: "center",
    },
    input: {
        flex: 1,
        padding: 12,
        borderRadius: 20,
        marginRight: 8,
        maxHeight: 100,
        fontFamily: "Outfit-Regular",
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    typingContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 16,
        marginLeft: 16,
        marginBottom: 8,
        alignSelf: "flex-start",
    },
    typingText: {
        fontSize: 14,
        fontFamily: "Outfit-Regular",
    },
    dotsContainer: {
        flexDirection: "row",
    },
    resetButton: {
        padding: 8,
        borderRadius: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: "Outfit-Bold",
        marginBottom: 12,
        textAlign: "center",
    },
    modalMessage: {
        fontSize: 16,
        fontFamily: "Outfit-Regular",
        marginBottom: 20,
        textAlign: "center",
        lineHeight: 24,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    cancelButton: {
        borderWidth: 1,
        backgroundColor: "transparent",
    },
    modalButtonText: {
        fontSize: 16,
        fontFamily: "Outfit-Medium",
    },
    scrollToBottomButton: {
        position: "absolute",
        right: 16,
        bottom: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
    },
});
