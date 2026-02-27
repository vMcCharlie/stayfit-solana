import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { SvgUri } from 'react-native-svg';

interface SmartImageProps {
    uri?: string;
    style?: StyleProp<ImageStyle>;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export const SmartImage: React.FC<SmartImageProps> = ({ uri, style, resizeMode = 'cover' }) => {
    if (!uri) return null;

    // Simple check for SVG extension
    const isSvg = uri.toLowerCase().endsWith('.svg');

    if (isSvg) {
        return (
            <SvgUri
                width="100%"
                height="100%"
                uri={uri}
                style={style}
                preserveAspectRatio={
                    resizeMode === 'contain' ? 'xMidYMid meet' :
                        resizeMode === 'cover' ? 'xMidYMid slice' :
                            'none'
                }
            />
        );
    }

    return (
        <Image
            source={{ uri }}
            style={style}
            resizeMode={resizeMode}
        />
    );
};
