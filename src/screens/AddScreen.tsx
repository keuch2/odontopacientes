import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AppText, AppButton } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

export default function AddScreen() {
  const navigation = useNavigation()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppText variant="h2" color="brandNavy" weight="bold">
          Agregar
        </AppText>
        <AppText color="textMuted" style={styles.description}>
          Selecciona qué deseas agregar
        </AppText>
        
        <View style={styles.buttonContainer}>
          <AppButton
            title="Agregar Paciente"
            onPress={() => navigation.navigate('CreatePatient' as never)}
            variant="primary"
            fullWidth
            style={styles.button}
          />
          <AppButton
            title="Registrar Sesión"
            onPress={() => {}}
            variant="secondary"
            fullWidth
            style={styles.button}
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
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    marginBottom: spacing.sm,
  },
})
