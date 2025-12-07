import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface UserAvatarProps {
    imageUrl?: string;
    size?: number;
    iconColor?: string;
    gradientColors?: [string, string];
    activeOpacity?: number;
    borderRadius?: number; // Radio de borde personalizable (0 = cuadrado)
}

/**
 * Componente de avatar de usuario con soporte para imagen y fallback a ícono
 * Muestra la foto del usuario si existe, o un ícono "person" con gradiente si no
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
    imageUrl,
    size = 60,
    iconColor = '#6366f1',
    gradientColors = ['#ffffff', '#eef2ff'],
    activeOpacity = 0.7,
    borderRadius, // Si no se provee, será circular (size / 2)
}) => {
    const [imageError, setImageError] = useState(false);

    // Determinar si mostrar imagen o fallback
    const shouldShowImage = imageUrl && !imageError;

    // Calcular el borderRadius (circular por defecto si no se especifica)
    const actualBorderRadius = borderRadius !== undefined ? borderRadius : size / 2;

    const containerStyle = {
        width: size,
        height: size,
        borderRadius: actualBorderRadius,
    };

    const imageStyle = {
        width: size,
        height: size,
        borderRadius: actualBorderRadius,
    };

    if (shouldShowImage) {
        return (
            <View style={[containerStyle, styles.whiteBackground]}>
                <Image
                    source={{ uri: `data:image/png;base64,${imageUrl}` }}
                    key={imageUrl?.substring(0, 20)}
                    style={imageStyle}
                    onError={() => {
                        if (__DEV__) {
                            console.warn('⚠️ Error al cargar imagen de usuario, usando fallback');
                        }
                        setImageError(true);
                    }}
                />
            </View>
        );
    }

    // Fallback: Gradiente con ícono "person"
    return (
        <LinearGradient
            colors={gradientColors}
            style={[containerStyle, styles.gradient]}
        >
            <Ionicons name="person" size={size * 0.47} color={iconColor} />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    whiteBackground: {
        backgroundColor: '#fff' + 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    imageBorder: {
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
});
