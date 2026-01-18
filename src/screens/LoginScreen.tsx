import React, { useEffect, useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../store/auth'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

interface LoginRouteParams {
  registered?: boolean
  email?: string
}

interface LoginScreenProps {
  onBackToWelcome?: () => void
  route?: {
    params?: LoginRouteParams
  }
}

export default function LoginScreen({ onBackToWelcome, route }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { login } = useAuthStore()

  useEffect(() => {
    const registered = route?.params?.registered
    const registeredEmail = route?.params?.email

    if (registered) {
      setSuccessMessage('Registro exitoso. Ingresa con tu email y contraseña')
      if (registeredEmail) {
        setEmail(String(registeredEmail))
      }
    } else {
      setSuccessMessage('')
    }
  }, [route?.params?.registered, route?.params?.email])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    console.log('[LoginScreen] Attempting login with email:', email);
    setError('')

    try {
      await login(email.toLowerCase().trim(), password.trim())
      console.log('[LoginScreen] Login successful for user:', email);
    } catch (err: any) {
      console.error('[LoginScreen] Login failed:', err)
      const message = err?.response?.data?.message || 'Credenciales incorrectas o error de conexión. Si estás seguro de que la contraseña es correcta, puede que tu cuenta esté pendiente de aprobación o haya un problema con el registro.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    // TODO: Implementar recuperación de contraseña
    console.log('Recuperar contraseña');
    Alert.alert('Recuperación de Contraseña', 'Actualmente, la recuperación de contraseña no está disponible. Como solución temporal, intenta registrar un nuevo usuario con el mismo correo electrónico para actualizar la contraseña.');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../imagenes_mobile/logo-login.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Tagline */}
          <AppText variant="body" color="brandNavy" align="center" style={styles.tagline}>
            <AppText>Conectando alumnos y pacientes.</AppText>
          </AppText>

          {successMessage ? (
            <View style={styles.successContainer}>
              <AppText variant="caption" style={styles.successText}>
                <AppText>{successMessage}</AppText>
              </AppText>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <AppText variant="body" weight="bold" color="white">
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </AppText>
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <AppText variant="body" color="brandNavy" style={styles.forgotPasswordText}>
                Olvidé mi contraseña
              </AppText>
            </TouchableOpacity>

            {/* Back to Welcome Button */}
            {onBackToWelcome && (
              <TouchableOpacity onPress={onBackToWelcome} style={styles.backButton}>
                <AppText variant="body" color="brandTurquoise" style={styles.backButtonText}>
                  ← Volver
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <AppText variant="caption" style={styles.errorText}>
                {error}
              </AppText>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 200,
    height: 140,
  },
  tagline: {
    marginBottom: spacing.xxl,
    fontSize: 16,
  },
  successContainer: {
    marginTop: -spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
  },
  successText: {
    color: '#166534',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.brandTurquoise,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 50,
    color: colors.white,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: colors.brandNavy,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 50,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  forgotPasswordText: {
    textDecorationLine: 'underline',
  },
  backButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
})
