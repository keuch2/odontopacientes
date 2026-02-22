import React from 'react'
import { Text, StyleSheet, TextProps } from 'react-native'
import { colors } from '../../theme/colors'

interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption'
  color?: keyof typeof colors
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right'
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = 'textPrimary',
  weight = 'normal',
  align = 'left',
  style,
  children,
  ...props
}) => {
  const textStyles = [
    styles.base,
    styles[variant],
    { color: colors[color] },
    { fontWeight: weightMap[weight] },
    { textAlign: align },
    style,
  ]

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  )
}

const weightMap = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
})
