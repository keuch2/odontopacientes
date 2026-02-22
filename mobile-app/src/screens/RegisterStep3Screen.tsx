import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, AppButton } from '../components/ui'
import { AppHeader } from '../components/AppHeader'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { useRegister } from '../contexts/RegisterContext'
import { api } from '../lib/api'

export default function RegisterStep3Screen({ navigation }: any) {
  const { registerData, resetRegisterData } = useRegister()
  const [loading, setLoading] = useState(false)

  const toIsoBirthDate = (value: string): string | undefined => {
    const trimmed = value.trim()

    if (!trimmed) {
      return undefined
    }

    const match = trimmed.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/)
    if (!match) {
      return undefined
    }

    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])

    if (!day || !month || !year || month > 12 || day > 31) {
      return undefined
    }

    const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const date = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(date.getTime())) {
      return undefined
    }

    return iso
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const birthDateIso = toIsoBirthDate(registerData.birthDate)

      const payload: {
        name: string
        email: string
        password: string
        phone: string
        birth_date?: string
        university_id?: number
        profile_image?: string
      } = {
        name: registerData.fullName.trim(),
        email: registerData.email.trim().toLowerCase(),
        phone: registerData.phone.trim(),
        password: registerData.password.trim(),
      }

      if (birthDateIso) {
        payload.birth_date = birthDateIso
      }

      if (registerData.university_id) {
        payload.university_id = registerData.university_id
      }

      if (registerData.profileImageBase64) {
        payload.profile_image = registerData.profileImageBase64
      }

      console.log('[RegisterStep3] Register payload:', {
        ...payload,
        password: `[LENGTH: ${payload.password.length}]`,
        passwordHasSpaces: payload.password !== payload.password.trim(),
      })
      console.log('[RegisterStep3] Raw password from context:', {
        length: registerData.password.length,
        hasLeadingSpace: registerData.password !== registerData.password.trimStart(),
        hasTrailingSpace: registerData.password !== registerData.password.trimEnd(),
      })

      const response = await api.auth.register(payload)

      const goToLogin = () => {
        console.log('[RegisterStep3] goToLogin called', {
          platform: Platform.OS,
          email: payload.email,
          hasReset: typeof navigation?.reset === 'function',
          hasNavigate: typeof navigation?.navigate === 'function',
        })

        resetRegisterData()

        const params = {
          registered: true,
          email: payload.email,
        }

        try {
          if (typeof navigation?.reset === 'function') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login', params }],
            })
            return
          }
        } catch (e) {
          console.error('[RegisterStep3] navigation.reset failed', e)
        }

        try {
          navigation?.navigate?.('Login', params)
        } catch (e) {
          console.error('[RegisterStep3] navigation.navigate failed', e)
        }
      }

      console.log('[RegisterStep3] register response', {
        platform: Platform.OS,
        status: response.status,
        dataKeys: response.data ? Object.keys(response.data) : null,
      })

      if (Platform.OS === 'web') {
        goToLogin()
        return
      }

      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada correctamente. Por favor inicia sesión.',
        [
          {
            text: 'OK',
            onPress: goToLogin,
          },
        ]
      )
    } catch (error: any) {
      const responseData = error.response?.data

      const validationErrors: Record<string, string[]> | undefined = responseData?.errors

      const errorLines = validationErrors
        ? Object.entries(validationErrors)
            .flatMap(([field, messages]) => {
              if (!Array.isArray(messages) || messages.length === 0) {
                return []
              }

              return [`${field}: ${messages.join(', ')}`]
            })
            .filter(Boolean)
        : []

      const errorMessage =
        errorLines.length > 0
          ? errorLines.join('\n')
          : responseData?.message ||
            'No se pudo completar el registro. Por favor intenta nuevamente.'

      if (Platform.OS === 'web') {
        alert(String(errorMessage))
      } else {
        Alert.alert('Error', String(errorMessage))
      }
      console.error('Error en registro:', responseData || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = () => {
    Alert.alert(
      'Próximamente',
      'La funcionalidad de suscripción premium estará disponible pronto.'
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showMenu={false} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" color="brandNavy" weight="bold" style={styles.greeting}>
          ¡Bienvenido {registerData.fullName.split(' ')[0]}!
        </AppText>

        <View style={styles.planSection}>
          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.planLabel}>
            Tu plan activo es:
          </AppText>

          <View style={styles.planCard}>
            <AppText variant="h2" color="brandNavy" weight="bold" style={styles.planTitle}>
              PLAN GRATUÍTO
            </AppText>
            <AppText color="textSecondary" style={styles.planDescription}>
              Con este plan, podrás crear tu perfil y navegar la aplicación, sin acceder a los datos de los pacientes.
            </AppText>
          </View>
        </View>

        <AppText color="brandNavy" weight="semibold" style={styles.upgradeLabel}>
          Accedé a la aplicación completa
        </AppText>
        <AppButton 
          title={loading ? "Completando Registro..." : "Completar Registro"}
          onPress={handleComplete}
          fullWidth
          style={styles.button}
          disabled={loading}
        />

        {/* Botón Premium (comentado por ahora)
        <AppButton 
          title="Suscribirse al Plan Premium" 
          onPress={handleSubscribe}
          fullWidth
          variant="outline"
          style={styles.premiumButton}
        />
        */}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  greeting: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  planSection: {
    marginBottom: spacing.xl,
  },
  planLabel: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.brandTurquoise,
    alignItems: 'center',
  },
  planTitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  planDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeLabel: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
  premiumButton: {
    marginTop: spacing.md,
  },
})
