import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { AppText } from './ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface ForgotPasswordModalProps {
  visible: boolean
  initialEmail: string
  onClose: () => void
}

export function ForgotPasswordModal({ visible, initialEmail, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (visible) setEmail(initialEmail)
  }, [visible, initialEmail])

  const handleSend = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      Alert.alert('Error', 'Ingresa tu email')
      return
    }

    setSending(true)
    try {
      const response = await api.auth.forgotPassword(normalizedEmail)
      onClose()
      Alert.alert('Revisa tu correo', response.data.message)
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo enviar el enlace. Revisa tu conexión.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <AppText variant="h3" weight="bold" color="brandNavy" align="center">Recuperar contraseña</AppText>
            <AppText color="textSecondary" align="center" style={styles.description}>
              Te enviaremos un enlace para crear una contraseña nueva.
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!sending}
            />
            <View style={styles.buttons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose} disabled={sending}>
                <AppText weight="semibold" color="textSecondary">Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.sendButton]} onPress={handleSend} disabled={sending}>
                {sending ? <ActivityIndicator color={colors.white} /> : <AppText weight="semibold" color="white">Enviar enlace</AppText>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg },
  description: { marginTop: spacing.sm, marginBottom: spacing.lg },
  input: { borderWidth: 1, borderColor: colors.brandTurquoise, borderRadius: 8, paddingHorizontal: spacing.md, minHeight: 50, fontSize: 16, color: colors.brandNavy, marginBottom: spacing.lg },
  buttons: { flexDirection: 'row', gap: spacing.md },
  button: { flex: 1, minHeight: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: colors.background },
  sendButton: { backgroundColor: colors.brandNavy },
})
