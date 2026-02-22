import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, AppButton } from '../components/ui'
import { useAuthStore } from '../store/auth'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

export default function SettingsScreen() {
  const logout = useAuthStore((state) => state.logout)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppText variant="h2" color="brandNavy" weight="bold">
          Configuración
        </AppText>
        <AppText color="textMuted" style={styles.description}>
          Ajustes de la aplicación
        </AppText>

        <View style={styles.section}>
          <AppButton
            title="Cerrar Sesión"
            onPress={logout}
            variant="outline"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  description: {
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
  },
})
