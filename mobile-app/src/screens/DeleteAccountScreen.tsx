import React, { useState } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { TextInput } from 'react-native-paper'
import { AppText, AppButton } from '../components/ui'
import { useAuthStore } from '../store/auth'
import { api } from '../lib/api'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

const CONFIRM_WORD = 'ELIMINAR'

export default function DeleteAccountScreen() {
  const navigation = useNavigation<any>()
  const logout = useAuthStore((s) => s.logout)
  const [password, setPassword] = useState('')
  const [confirmWord, setConfirmWord] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`)
      onOk?.()
      return
    }
    Alert.alert(title, message, [{ text: 'Aceptar', onPress: onOk }])
  }

  const canSubmit = password.length > 0 && confirmWord.trim().toUpperCase() === CONFIRM_WORD

  const handleDelete = () => {
    if (!canSubmit) return

    Alert.alert(
      '¿Eliminar tu cuenta?',
      'Esta acción es definitiva. Se eliminarán tu nombre, correo, teléfono, foto de perfil y notificaciones. No podrás recuperar tu cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar definitivamente',
          style: 'destructive',
          onPress: doDelete,
        },
      ],
    )
  }

  const doDelete = async () => {
    setLoading(true)
    try {
      await api.account.delete({
        password,
        confirm: CONFIRM_WORD,
      })

      showAlert(
        'Cuenta eliminada',
        'Tu cuenta y tus datos personales fueron eliminados. La sesión se cerrará ahora.',
        () => {
          logout()
        },
      )
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'No se pudo eliminar la cuenta. Verifica tu contraseña e intenta nuevamente.'
      showAlert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.brandNavy} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" color="brandNavy">
          Eliminar Cuenta
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={28} color={colors.error} style={{ marginBottom: spacing.sm }} />
          <AppText variant="body" weight="bold" color="error" style={{ marginBottom: spacing.xs }}>
            Esta acción no se puede deshacer
          </AppText>
          <AppText variant="body" color="textPrimary">
            Si continúas, eliminaremos de forma permanente:
          </AppText>
        </View>

        <View style={styles.bulletList}>
          {[
            'Tu nombre, correo electrónico, teléfono y dirección.',
            'Tu foto de perfil.',
            'Tus notificaciones y preferencias.',
            'Tus sesiones activas.',
          ].map((item) => (
            <View key={item} style={styles.bulletRow}>
              <AppText color="error" style={styles.bullet}>•</AppText>
              <AppText variant="body" color="textPrimary" style={{ flex: 1 }}>
                {item}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.noteBox}>
          <AppText variant="caption" color="textSecondary">
            Por motivos académicos y legales, los datos de pacientes y procedimientos clínicos que
            registraste durante tu actividad académica quedarán asociados a la cátedra/institución
            correspondiente, no a tu identidad. Tu nombre será reemplazado por &quot;Cuenta eliminada&quot;.
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText variant="body" weight="semibold" color="brandNavy" style={styles.label}>
            Confirma tu contraseña actual
          </AppText>
          <View style={styles.inputContainer}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              placeholder="Tu contraseña"
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.toggleVisibility}
              onPress={() => setShowPassword(!showPassword)}
            >
              <AppText color="brandTurquoise" weight="semibold">
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <AppText variant="body" weight="semibold" color="brandNavy" style={styles.label}>
            Para confirmar, escribe: {CONFIRM_WORD}
          </AppText>
          <TextInput
            value={confirmWord}
            onChangeText={setConfirmWord}
            mode="outlined"
            style={styles.input}
            placeholder={CONFIRM_WORD}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <AppButton
          title={loading ? 'Eliminando…' : 'Eliminar mi cuenta'}
          onPress={handleDelete}
          fullWidth
          variant="primary"
          style={styles.deleteButton}
          disabled={!canSubmit || loading}
        />

        <AppButton
          title="Cancelar"
          onPress={() => navigation.goBack()}
          fullWidth
          variant="outline"
          style={styles.cancelButton}
          disabled={loading}
        />

        <AppText variant="caption" color="textSecondary" style={styles.contactHint}>
          ¿Necesitas ayuda? Escríbenos a privacidad@codexpy.com
        </AppText>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  bulletList: {
    marginBottom: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  bullet: {
    width: 20,
    fontSize: 18,
    lineHeight: 22,
  },
  noteBox: {
    backgroundColor: '#F6F8FA',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.white,
  },
  toggleVisibility: {
    position: 'absolute',
    right: 12,
    top: 18,
  },
  deleteButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.error,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
  contactHint: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
})
