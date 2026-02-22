import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, AppInput, AppButton } from '../components/ui'
import { AppHeader } from '../components/AppHeader'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { useRegister } from '../contexts/RegisterContext'
import { api } from '../lib/api'

export default function RegisterStep1Screen({ navigation }: any) {
  const { registerData, updateRegisterData } = useRegister()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailCheckMessage, setEmailCheckMessage] = useState<string>('')

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`)
      return
    }

    Alert.alert(title, message)
  }

  const [universities, setUniversities] = useState<{id: number, name: string}[]>([])
  const [showUniversityPicker, setShowUniversityPicker] = useState(false)

  const [formData, setFormData] = useState({
    fullName: registerData.fullName || '',
    email: registerData.email || '',
    phone: registerData.phone || '',
    birthDate: registerData.birthDate || '',
    university_id: registerData.university_id as number | null,
    password: registerData.password || '',
    confirmPassword: registerData.confirmPassword || '',
  })

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await api.universities.list()
        if (response.data?.data) {
          setUniversities(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching universities:', error)
      }
    }
    fetchUniversities()
  }, [])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{9,10}$/
    return phoneRegex.test(phone.replace(/\D/g, ''))
  }

  const formatBirthDateInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)

    if (digits.length <= 2) {
      return digits
    }

    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`
    }

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  const isValidBirthDate = (value: string) => {
    const trimmed = value.trim()
    const match = trimmed.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/)
    if (!match) return false
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])

    if (!day || !month || !year || month > 12 || day > 31) return false

    const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const date = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(date.getTime())) return false

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return date.getTime() <= today.getTime()
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido'
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Ingresa un email válido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El celular es requerido'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Ingresa un número válido (9-10 dígitos)'
    }

    if (!formData.birthDate.trim()) {
      newErrors.birthDate = 'La fecha de nacimiento es requerida'
    } else if (!isValidBirthDate(formData.birthDate)) {
      newErrors.birthDate = 'Selecciona una fecha válida'
    }

    if (!formData.university_id) {
      newErrors.university_id = 'Debes seleccionar una universidad'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    } else if (formData.password !== formData.password.trim()) {
      newErrors.password = 'La contraseña no puede tener espacios al inicio o al final'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la contraseña'
    } else if (formData.password.trim() !== formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    setEmailCheckMessage('')
    if (!validateForm()) {
      showAlert('Campos incompletos', 'Por favor completa todos los campos correctamente.')
      return
    }

    const proceedToNext = () => {
      console.log('[RegisterStep1] proceedToNext - Attempting navigation to RegisterStep2');

      updateRegisterData({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        university_id: formData.university_id,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })

      // Usar un pequeño retraso para asegurar que el estado se actualice antes de navegar
      setTimeout(() => {
        try {
          console.log('[RegisterStep1] Checking navigation object:', navigation ? 'Navigation object exists' : 'Navigation object is undefined');
          if (Platform.OS === 'web' && typeof navigation?.reset === 'function') {
            console.log('[RegisterStep1] Attempting navigation.reset for web');
            navigation.reset({
              index: 0,
              routes: [{ name: 'RegisterStep2' }],
            })
            console.log('[RegisterStep1] navigation.reset executed successfully');
            return;
          }
        } catch (e) {
          console.error('[RegisterStep1] navigation.reset failed', e);
        }

        try {
          console.log('[RegisterStep1] Falling back to navigation.navigate');
          navigation?.navigate?.('RegisterStep2');
          console.log('[RegisterStep1] navigation.navigate executed');
        } catch (e) {
          console.error('[RegisterStep1] navigation.navigate failed', e);
        }
      }, 100);
    }

    const normalizedEmail = formData.email.trim().toLowerCase()

    try {
      const response = await api.auth.checkEmail(normalizedEmail)
      if (response.data?.exists) {
        setErrors((prev) => ({ ...prev, email: 'El email ya está registrado. Usa otro email o inicia sesión.' }))
        return
      }
    } catch (error) {
      console.error('Error checking email:', error)
      setEmailCheckMessage(
        'No pudimos verificar si el email ya está registrado. Continuamos sin verificación (se validará al completar el registro).'
      )
      proceedToNext()
      return
    }

    proceedToNext()
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showMenu={false} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <AppText variant="h2" color="brandNavy" weight="bold" style={styles.title}>
          Registro de Usuario
        </AppText>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <AppInput
              placeholder="Nombre Completo"
              value={formData.fullName}
              onChangeText={(text) => {
                setFormData({...formData, fullName: text})
                if (errors.fullName) setErrors({...errors, fullName: ''})
              }}
            />
            {errors.fullName && (
              <AppText color="error" variant="caption" style={styles.errorText}>
                {errors.fullName}
              </AppText>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <AppInput
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text.replace(/\s/g, '') })
                if (emailCheckMessage) setEmailCheckMessage('')
                if (errors.email) setErrors({...errors, email: ''})
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <AppText color="error" variant="caption" style={styles.errorText}>
                {errors.email}
              </AppText>
            )}
            {!!emailCheckMessage && !errors.email && (
              <AppText color="textMuted" variant="caption" style={styles.errorText}>
                {emailCheckMessage}
              </AppText>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <AppInput
              placeholder="Celular"
              value={formData.phone}
              onChangeText={(text) => {
                const onlyDigits = text.replace(/\D/g, '')
                setFormData({ ...formData, phone: onlyDigits })
                if (errors.phone) setErrors({...errors, phone: ''})
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.phone && (
              <AppText color="error" variant="caption" style={styles.errorText}>
                {errors.phone}
              </AppText>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <AppInput
              placeholder="Fecha de Nacimiento (DD/MM/AAAA)"
              value={formData.birthDate}
              onChangeText={(text) => {
                setFormData({ ...formData, birthDate: formatBirthDateInput(text) })
                if (errors.birthDate) setErrors({ ...errors, birthDate: '' })
              }}
              keyboardType="number-pad"
              maxLength={10}
            />
            {errors.birthDate && (
              <AppText color="error" variant="caption" style={styles.errorText}>
                {errors.birthDate}
              </AppText>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                errors.university_id ? styles.pickerButtonError : null,
              ]}
              onPress={() => setShowUniversityPicker(!showUniversityPicker)}
              activeOpacity={0.7}
            >
              <AppText
                color={formData.university_id ? 'textPrimary' : 'textMuted'}
                style={styles.pickerButtonText}
              >
                {formData.university_id
                  ? universities.find(u => u.id === formData.university_id)?.name || 'Universidad'
                  : 'Seleccionar Universidad'}
              </AppText>
              <AppText color="textMuted" style={styles.pickerArrow}>
                {showUniversityPicker ? '▲' : '▼'}
              </AppText>
            </TouchableOpacity>
            {showUniversityPicker && (
              <View style={styles.pickerDropdown}>
                {universities.length === 0 ? (
                  <AppText color="textMuted" style={styles.pickerOption}>
                    Cargando universidades...
                  </AppText>
                ) : (
                  universities.map((uni) => (
                    <TouchableOpacity
                      key={uni.id}
                      style={[
                        styles.pickerOption,
                        formData.university_id === uni.id && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setFormData({...formData, university_id: uni.id})
                        setShowUniversityPicker(false)
                        if (errors.university_id) setErrors({...errors, university_id: ''})
                      }}
                    >
                      <AppText
                        color={formData.university_id === uni.id ? 'brandTurquoise' : 'textPrimary'}
                        weight={formData.university_id === uni.id ? 'semibold' : 'normal'}
                      >
                        {uni.name}
                      </AppText>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
            {errors.university_id && (
              <AppText color="error" variant="caption" style={styles.errorText}>
                {errors.university_id}
              </AppText>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.passwordContainer}>
              <AppInput
                placeholder="Contraseña"
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({...formData, password: text})
                  if (errors.password) setErrors({...errors, password: ''})
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <AppText color="brandTurquoise" weight="semibold">
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </AppText>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <AppText color="error" variant="caption" style={styles.errorText}>
                {errors.password}
              </AppText>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.passwordContainer}>
              <AppInput
                placeholder="Repetir Contraseña"
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData({...formData, confirmPassword: text})
                  if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''})
                }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <AppText color="brandTurquoise" weight="semibold">
                  {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                </AppText>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <AppText color="error" variant="caption" style={styles.errorText}>
                {errors.confirmPassword}
              </AppText>
            )}
          </View>

          <AppButton 
            title="Siguiente" 
            onPress={handleNext}
            fullWidth
            style={styles.nextButton}
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  form: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: spacing.xs,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  nextButton: {
    marginTop: spacing.md,
  },
  spacer: {
    height: spacing.xxl,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    backgroundColor: colors.white,
  },
  pickerButtonError: {
    borderColor: '#EF4444',
  },
  pickerButtonText: {
    flex: 1,
  },
  pickerArrow: {
    marginLeft: spacing.sm,
    fontSize: 12,
  },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerOptionSelected: {
    backgroundColor: '#F0FAFA',
  },
})
