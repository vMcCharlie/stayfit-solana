import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  InteractionManager,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../src/context/theme';

interface ExerciseImageProps {
  uri?: string | null;
  fallbackUri?: string | null;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  showLoadingIndicator?: boolean;
  backgroundColor?: string;
  // For animated exercises
  frameUrls?: string[];
  animationSpeed?: number;
  animate?: boolean;
}

// Global in-memory cache for fetched SVG content
const svgCache: Map<string, string> = new Map();

// Track URLs currently being fetched to avoid duplicate requests
const pendingFetches: Map<string, Promise<string | null>> = new Map();

/**
 * Check if URL is an SVG
 */
export const isSvgUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.svg') ||
    lowerUrl.includes('/svg') ||
    lowerUrl.includes('svg/') ||
    lowerUrl.includes('.svg?');
};

/**
 * Fetch and cache a single SVG
 * Returns the SVG content or null if fetch failed
 */
export const fetchAndCacheSvg = async (url: string): Promise<string | null> => {
  if (!url || !isSvgUrl(url)) return null;

  // Check cache first
  const cached = svgCache.get(url);
  if (cached) return cached;

  // Check if already fetching
  const pending = pendingFetches.get(url);
  if (pending) return pending;

  // Create new fetch promise
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'image/svg+xml, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();

      // Validate it's actually SVG content
      if (text.includes('<svg') || text.includes('<?xml')) {
        let cleanedSvg = text;

        // Add viewBox if missing
        if (!cleanedSvg.includes('viewBox') && cleanedSvg.includes('<svg')) {
          cleanedSvg = cleanedSvg.replace(/<svg/, '<svg viewBox="0 0 500 500"');
        }

        // Cache the content
        svgCache.set(url, cleanedSvg);
        return cleanedSvg;
      }

      return null;
    } catch (error) {
      console.log('SVG fetch failed for:', url);
      return null;
    } finally {
      // Remove from pending
      pendingFetches.delete(url);
    }
  })();

  // Store the pending promise
  pendingFetches.set(url, fetchPromise);

  return fetchPromise;
};

/**
 * Preload multiple SVGs in parallel
 * Returns a map of URL -> SVG content (or null if failed)
 */
export const preloadSvgs = async (
  urls: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, string | null>> => {
  const results = new Map<string, string | null>();
  const uniqueUrls = [...new Set(urls.filter(url => url && isSvgUrl(url)))];

  if (uniqueUrls.length === 0) {
    return results;
  }

  let loaded = 0;
  const total = uniqueUrls.length;

  // Fetch all SVGs in parallel with a concurrency limit
  const BATCH_SIZE = 8; // Process 8 at a time for faster loading

  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const content = await fetchAndCacheSvg(url);
        loaded++;
        onProgress?.(loaded, total);
        return { url, content };
      })
    );

    batchResults.forEach(({ url, content }) => {
      results.set(url, content);
    });
  }

  return results;
};

/**
 * Check if an SVG is already cached
 */
export const isSvgCached = (url: string): boolean => {
  return svgCache.has(url);
};

/**
 * Get cached SVG content
 */
export const getCachedSvg = (url: string): string | null => {
  return svgCache.get(url) || null;
};

/**
 * Clear all cached SVGs
 */
export const clearSvgCache = (): void => {
  svgCache.clear();
};

/**
 * Smart component that handles exercise images with smooth animation
 * - Preloads all animation frames for smooth playback
 * - Uses pre-cached SVG content when available
 * - Falls back to regular Image for non-SVG formats
 * - Handles loading states and errors gracefully
 */
const ExerciseImage = memo(({
  uri,
  fallbackUri,
  width = 80,
  height = 80,
  style,
  borderRadius = 12,
  showLoadingIndicator = true,
  backgroundColor,
  frameUrls,
  animationSpeed = 500,
  animate = true,
}: ExerciseImageProps) => {
  const { isDarkMode, selectedPalette } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  // Store all frame contents for smooth animation
  const [frameContents, setFrameContents] = useState<{ [key: number]: string }>({});
  const [singleSvgContent, setSingleSvgContent] = useState<string | null>(null);
  const animationInterval = useRef<any>(null);
  const loadedIndicesRef = useRef<number[]>([]);
  const isMounted = useRef(true);

  const bgColor = backgroundColor ?? (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)');

  // Check if we have animation frames
  const hasFrames = frameUrls && frameUrls.length > 0 && animate;
  const frameCount = frameUrls?.length || 0;

  // Get the appropriate URI for single image mode
  const singleUri = hasError && fallbackUri ? fallbackUri : uri;
  const isSingleSvg = isSvgUrl(singleUri);

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

  // Load animation frames progressively - show first frame immediately, load others in background
  useEffect(() => {
    if (!hasFrames || !frameUrls) {
      return;
    }

    const loadFramesProgressively = async () => {
      setIsLoading(true);
      const contents: { [key: number]: string } = {};

      // PRIORITY 1: Load first frame immediately for instant display
      const firstUrl = frameUrls[0];
      let firstContent = getCachedSvg(firstUrl);
      if (!firstContent) {
        firstContent = await fetchAndCacheSvg(firstUrl);
      }

      if (firstContent && isMounted.current) {
        contents[0] = firstContent;
        setFrameContents({ ...contents });
        setIsLoading(false); // Show first frame immediately
      }

      // PRIORITY 2: Load remaining frames in background after interactions complete
      InteractionManager.runAfterInteractions(() => {
        if (!isMounted.current) return;

        const loadRemainingFrames = async () => {
          const remainingUrls = frameUrls.slice(1);

          // Load in smaller batches to avoid blocking
          const BATCH_SIZE = 4;
          for (let i = 0; i < remainingUrls.length; i += BATCH_SIZE) {
            if (!isMounted.current) return;

            const batch = remainingUrls.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
              batch.map(async (url, batchIndex) => {
                const actualIndex = i + batchIndex + 1; // +1 because we skip first frame
                let content = getCachedSvg(url);
                if (!content) {
                  content = await fetchAndCacheSvg(url);
                }
                return { index: actualIndex, content };
              })
            );

            if (isMounted.current) {
              batchResults.forEach(({ index, content }) => {
                if (content) {
                  contents[index] = content;
                }
              });
              setFrameContents({ ...contents });
            }
          }
        };

        loadRemainingFrames();
      });
    };

    loadFramesProgressively();
  }, [frameUrls, hasFrames]);

  // Animation loop for frame-based animations - optimized to only cycle through loaded frames
  useEffect(() => {
    if (!hasFrames || frameCount <= 1 || (animate as any) === false) {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
      return;
    }

    // Get the indices of loaded frames
    const loadedIndices = Object.keys(frameContents)
      .map(Number)
      .sort((a, b) => a - b);

    // Store loaded indices in ref for use in the interval callback (avoids stale closures)
    loadedIndicesRef.current = loadedIndices;

    // Check if we are fully loaded or at least have enough frames to start
    // We only create/restart the interval when the loaded frame count changes
    // or when we first reach the minimum viable count (2 frames)
    const canAnimate = loadedIndices.length >= 2;

    if (!canAnimate) {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
      return;
    }

    // If interval already exists and we're just adding more frames, 
    // we don't necessarily need to restart it every single time if we use functional updates.
    // However, to be safe and consistent, we restart it when loading is completely finished
    // or when we hit the first viable threshold.
    const isFullyLoaded = loadedIndices.length === frameCount;

    // Clear any existing interval
    if (animationInterval.current) {
      clearInterval(animationInterval.current);
    }

    // Start new animation loop
    animationInterval.current = setInterval(() => {
      // Access current loaded indices from ref to always have the latest set
      const currentIndices = loadedIndicesRef.current;
      if (currentIndices.length < 2) return;

      setCurrentFrame((prev) => {
        // Find the index of the previously displayed frame among currently loaded ones
        const currentPos = currentIndices.indexOf(prev);
        // If the frame is no longer available, start from the beginning
        // Otherwise move to the next index in the loop
        const nextPos = currentPos === -1 ? 0 : (currentPos + 1) % currentIndices.length;
        return currentIndices[nextPos];
      });
    }, animationSpeed);

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, [frameCount, animationSpeed, hasFrames, animate, Object.keys(frameContents).length === frameCount]);

  // Load single SVG content when not using frame animation
  useEffect(() => {
    if (hasFrames || !singleUri) {
      return;
    }

    if (!isSingleSvg) {
      setIsLoading(true);
      return;
    }

    // Check cache first
    const cached = getCachedSvg(singleUri);
    if (cached) {
      setSingleSvgContent(cached);
      setIsLoading(false);
      return;
    }

    // Fetch the SVG
    setIsLoading(true);
    fetchAndCacheSvg(singleUri).then((content) => {
      if (isMounted.current) {
        if (content) {
          setSingleSvgContent(content);
          setHasError(false);
        } else {
          setHasError(true);
        }
        setIsLoading(false);
      }
    });
  }, [singleUri, isSingleSvg, hasFrames]);

  const handleImageLoad = () => {
    if (isMounted.current) {
      setIsLoading(false);
      setHasError(false);
    }
  };

  const handleImageError = () => {
    if (isMounted.current) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  // Render frame animation
  if (hasFrames && frameUrls) {
    const currentFrameContent = frameContents[currentFrame];

    // Show loading while frames are being fetched
    if (isLoading || Object.keys(frameContents).length === 0) {
      return (
        <View
          style={[
            styles.container,
            {
              width: width as any,
              height: height as any,
              borderRadius,
              backgroundColor: bgColor,
              overflow: 'hidden',
            },
            style,
          ]}
        >
          {showLoadingIndicator && (
            <ActivityIndicator size="small" color={selectedPalette.primary} />
          )}
        </View>
      );
    }

    // Render current frame
    if (currentFrameContent) {
      return (
        <View
          style={[
            styles.container,
            {
              width: width as any,
              height: height as any,
              borderRadius,
              backgroundColor: bgColor,
              overflow: 'hidden',
            },
            style,
          ]}
        >
          <SvgXml
            xml={currentFrameContent}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          />
        </View>
      );
    }
  }

  // No valid URL - show placeholder
  if (!singleUri || (hasError && !fallbackUri)) {
    return (
      <View
        style={[
          styles.container,
          {
            width: width as any,
            height: height as any,
            borderRadius,
            backgroundColor: bgColor,
          },
          style,
        ]}
      >
        <View style={styles.placeholder}>
          <View style={[styles.placeholderIcon, { backgroundColor: selectedPalette.primary + '30' }]} />
        </View>
      </View>
    );
  }

  // Render single SVG using SvgXml
  if (singleSvgContent && isSingleSvg && !hasError) {
    return (
      <View
        style={[
          styles.container,
          {
            width: width as any,
            height: height as any,
            borderRadius,
            backgroundColor: bgColor,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <SvgXml
          xml={singleSvgContent}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        />
      </View>
    );
  }

  // Show loading for SVGs being fetched
  if (isSingleSvg && isLoading && !hasError) {
    return (
      <View
        style={[
          styles.container,
          {
            width: width as any,
            height: height as any,
            borderRadius,
            backgroundColor: bgColor,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {showLoadingIndicator && (
          <ActivityIndicator size="small" color={selectedPalette.primary} />
        )}
      </View>
    );
  }

  // Render regular Image (for non-SVG or as fallback when SVG fails)
  const imageUri = hasError && fallbackUri ? fallbackUri : singleUri;

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: bgColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {isLoading && showLoadingIndicator && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={selectedPalette.primary} />
        </View>
      )}
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, { borderRadius }]}
        resizeMode="cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: '40%',
    height: '40%',
    borderRadius: 8,
  },
});

export default ExerciseImage;
