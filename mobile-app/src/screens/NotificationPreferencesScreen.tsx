import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface TreatmentPref {
  treatment_id: number
  treatment_name: string
  chair_name: string
  enabled: boolean
}

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation()
  const [preferences, setPreferences] = useState<TreatmentPref[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await api.notificationPreferences.list()
      setPreferences(response.data.data || [])
    } catch (error: any) {
      console.error('Error loading preferences:', error)
      Alert.alert('Error', 'No se pudieron cargar las preferencias')
    } finally {
      setLoading(false)
    }
  }

  const togglePreference = (treatmentId: number) => {
    setPreferences(prev =>
      prev.map(p =>
        p.treatment_id === treatmentId ? { ...p, enabled: !p.enabled } : p
      )
    )
  }

  const toggleAll = (enabled: boolean) => {
    setPreferences(prev => prev.map(p => ({ ...p, enabled })))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const enabledIds = preferences.filter(p => p.enabled).map(p => p.treatment_id)
      await api.notificationPreferences.update(enabledIds)
      Alert.alert('Éxito', 'Preferencias guardadas correctamente')
      navigation.goBack()
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudieron guardar las preferencias')
    } finally {
      setSaving(false)
    }
  }

  // Group preferences by chair
  const grouped = preferences.reduce((acc, pref) => {
    const key = pref.chair_name || 'Sin Cátedra'
    if (!acc[key]) acc[key] = []
    acc[key].push(pref)
    return acc
  }, {} as Record<string, TreatmentPref[]>)

  const enabledCount = preferences.filter(p => p.enabled).length

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandTurquoise} />
          <AppText color="textMuted" style={{ marginTop: spacing.md }}>Cargando preferencias...</AppText>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Notificaciones
          </AppText>
          <AppText color="textMuted" style={{ marginTop: spacing.xs, fontSize: 13 }}>
            Elige qué tratamientos deseas que te notifiquen cuando estén disponibles.
          </AppText>
        </View>

        <View style={styles.summaryBar}>
          <AppText color="brandNavy" weight="semibold" style={{ fontSize: 13 }}>
            {enabledCount} de {preferences.length} seleccionados
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity style={styles.quickAction} onPress={() => toggleAll(true)}>
              <AppText color="brandTurquoise" weight="semibold" style={{ fontSize: 12 }}>Todos</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => toggleAll(false)}>
              <AppText color="error" weight="semibold" style={{ fontSize: 12 }}>Ninguno</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {Object.entries(grouped).map(([chairName, treatments]) => (
          <View key={chairName} style={styles.chairGroup}>
            <View style={styles.chairHeader}>
              <Ionicons name="school-outline" size={18} color={colors.brandNavy} />
              <AppText color="brandNavy" weight="bold" style={{ marginLeft: 8, fontSize: 15 }}>
                {chairName}
              </AppText>
            </View>
            {treatments.map((pref) => (
              <View key={pref.treatment_id} style={styles.treatmentRow}>
                <AppText color="brandNavy" style={{ flex: 1, fontSize: 14 }}>
                  {pref.treatment_name}
                </AppText>
                <Switch
                  value={pref.enabled}
                  onValueChange={() => togglePreference(pref.treatment_id)}
                  trackColor={{ false: '#E0E0E0', true: colors.brandTurquoise }}
                  thumbColor={pref.enabled ? colors.white : '#F4F3F4'}
                />
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <AppText color="white" weight="bold" style={{ fontSize: 16 }}>Guardar Preferencias</AppText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  quickAction: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chairGroup: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  chairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4F8',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  treatmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.brandTurquoise,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
})
