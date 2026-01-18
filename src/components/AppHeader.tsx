import React from 'react'
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

interface AppHeaderProps {
  onMenuPress?: () => void
  showMenu?: boolean
}

export function AppHeader({ onMenuPress, showMenu = true }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../../imagenes_mobile/logo-app.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Menú Hamburguesa */}
      {showMenu && (
        <TouchableOpacity 
          onPress={onMenuPress}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={32} color={colors.brandNavy} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 150,
    height: 40,
  },
  menuButton: {
    padding: spacing.xs,
  },
})
