import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../src/context/theme';
import { fetchAndCacheSvg, getCachedSvg, isSvgUrl } from './ExerciseImage';

interface AnimatedExerciseImageProps {
    frameUrls: string[];
    size?: number;
    style?: StyleProp<ViewStyle>;
    animationSpeed?: number;
    backgroundColor?: string;
}

/**
 * Component that animates through exercise SVG frames to create a GIF-like effect
 * Displays in a square container for consistent design
 * Uses shared SVG cache from ExerciseImage for better performance
 */
export default function AnimatedExerciseImage({
    frameUrls,
    size = 80,
    style,
    animationSpeed = 600,
    backgroundColor,
}: AnimatedExerciseImageProps) {
    const { isDarkMode, selectedPalette } = useTheme();
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [svgContents, setSvgContents] = useState<{ [key: number]: string }>({});
    const animationInterval = useRef<NodeJS.Timeout | null>(null);
    const isMounted = useRef(true);

    const bgColor = backgroundColor || (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)');

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
            }
        };
    }, []);

    // Pre-fetch SVG contents using the shared cache
    useEffect(() => {
        if (!frameUrls || frameUrls.length === 0) {
            setIsLoading(false);
            return;
        }

        const fetchSvgContents = async () => {
            const contents: { [key: number]: string } = {};
            let anySuccess = false;

            // First, check if any are already cached (synchronous)
            for (let i = 0; i < frameUrls.length; i++) {
                const url = frameUrls[i];
                if (isSvgUrl(url)) {
                    const cached = getCachedSvg(url);
                    if (cached) {
                        contents[i] = cached;
                        anySuccess = true;
                    }
                }
            }

            // If all are cached, no need to fetch
            if (Object.keys(contents).length === frameUrls.length) {
                if (isMounted.current) {
                    setSvgContents(contents);
                    setHasError(false);
                    setIsLoading(false);
                }
                return;
            }

            // Fetch remaining frames
            const fetchPromises = frameUrls.map(async (url, i) => {
                if (contents[i]) return; // Already cached
                
                if (isSvgUrl(url)) {
                    const svgContent = await fetchAndCacheSvg(url);
                    if (svgContent) {
                        contents[i] = svgContent;
                        anySuccess = true;
                    }
                }
            });

            await Promise.all(fetchPromises);

            if (isMounted.current) {
                setSvgContents(contents);
                setHasError(!anySuccess && Object.keys(contents).length === 0);
                setIsLoading(false);
            }
        };

        fetchSvgContents();
    }, [frameUrls]);

    // Start animation loop
    useEffect(() => {
        // Only animate if we have multiple frames and loaded content
        if (!frameUrls || frameUrls.length <= 1 || hasError || isLoading) {
            return;
        }

        // Clear any existing interval
        if (animationInterval.current) {
            clearInterval(animationInterval.current);
        }

        // Start new animation loop
        animationInterval.current = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % frameUrls.length);
        }, animationSpeed);

        // Cleanup on unmount
        return () => {
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
            }
        };
    }, [frameUrls, animationSpeed, hasError, isLoading]);

    // If no frames, show placeholder
    if (!frameUrls || frameUrls.length === 0 || hasError) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        width: size,
                        height: size,
                        backgroundColor: bgColor,
                    },
                    style,
                ]}
            >
                <View style={[styles.placeholder, { backgroundColor: selectedPalette.primary + '30' }]} />
            </View>
        );
    }

    // Show loading state
    if (isLoading) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        width: size,
                        height: size,
                        backgroundColor: bgColor,
                    },
                    style,
                ]}
            >
                <ActivityIndicator size="small" color={selectedPalette.primary} />
            </View>
        );
    }

    // Get current SVG content
    const currentSvgContent = svgContents[currentFrame];

    if (!currentSvgContent) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        width: size,
                        height: size,
                        backgroundColor: bgColor,
                    },
                    style,
                ]}
            >
                <View style={[styles.placeholder, { backgroundColor: selectedPalette.primary + '30' }]} />
            </View>
        );
    }

    return (
        <View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    backgroundColor: bgColor,
                },
                style,
            ]}
        >
            <SvgXml
                xml={currentSvgContent}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        width: '40%',
        height: '40%',
        borderRadius: 8,
    },
});
