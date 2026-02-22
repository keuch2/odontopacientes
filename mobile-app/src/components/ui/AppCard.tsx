import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'

interface AppCardProps {
  children: React.ReactNode
  style?: ViewStyle
  padding?: keyof typeof spacing
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  padding = 'md',
}) => {
  return (
    <View
      style={[
        styles.card,
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
})
