import React, { useState } from 'react';
import { Image, ImageProps, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ImageWithFallbackProps extends Omit<ImageProps, 'source'> {
  source: { uri?: string } | number;
  fallbackIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
}

/**
 * Componente de imagen con fallback automático
 * Si la imagen falla al cargar, muestra un ícono de placeholder
 */
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  source,
  fallbackIcon = 'image-off-outline',
  fallbackIconSize = 48,
  fallbackIconColor = colors.textMuted,
  style,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Si es una imagen local (require), renderizar directamente
  if (typeof source === 'number') {
    return <Image source={source} style={style} {...props} />;
  }

  // Si no hay URI o hubo error, mostrar fallback
  if (!source.uri || hasError) {
    return (
      <MaterialCommunityIcons
        name={fallbackIcon}
        size={fallbackIconSize}
        color={fallbackIconColor}
        style={[styles.fallbackIcon, style]}
      />
    );
  }

  return (
    <Image
      source={{ uri: source.uri }}
      style={style}
      onError={() => {
        console.warn(`Failed to load image: ${source.uri}`);
        setHasError(true);
        setIsLoading(false);
      }}
      onLoadStart={() => setIsLoading(true)}
      onLoadEnd={() => setIsLoading(false)}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  fallbackIcon: {
    alignSelf: 'center',
  },
});
