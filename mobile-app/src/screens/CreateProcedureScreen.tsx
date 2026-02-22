import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import { TextInput, Button, HelperText, Menu } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { api } from '../lib/api'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { AppText } from '../components/ui'

const TOOTH_SURFACES = [
  { label: 'O', value: 'O' },
  { label: 'M', value: 'M' },
  { label: 'D', value: 'D' },
  { label: 'V', value: 'V' },
  { label: 'L', value: 'L' },
]

export default function CreateProcedureScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { patientId } = route.params as { patientId: number }
  
  // Form state
  const [chairId, setChairId] = useState<number | null>(null)
  const [treatmentId, setTreatmentId] = useState<number | null>(null)
  const [toothFdi, setToothFdi] = useState('')
  const [toothSurface, setToothSurface] = useState('')
  const [description, setDescription] = useState('')
  
  // Data state
  const [chairs, setChairs] = useState<any[]>([])
  const [allTreatments, setAllTreatments] = useState<any[]>([])
  
  // Menu visibility state
  const [chairMenuVisible, setChairMenuVisible] = useState(false)
  const [treatmentMenuVisible, setTreatmentMenuVisible] = useState(false)
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [chairsResponse, treatmentsResponse] = await Promise.all([
        api.chairs.list(),
        api.treatments.list(),
      ])
      
      setChairs(chairsResponse.data.data || [])
      setAllTreatments(treatmentsResponse.data.data || [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
      Alert.alert('Error', 'No se pudo cargar la información necesaria')
    } finally {
      setFetching(false)
    }
  }

  const filteredTreatments = chairId
    ? allTreatments.filter(t => t.chair_id === chairId)
    : []

  const handleChairChange = (id: number) => {
    setChairId(id)
    setTreatmentId(null)
    setChairMenuVisible(false)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!chairId) newErrors.chairId = 'Debe seleccionar una cátedra'
    if (!treatmentId) newErrors.treatmentId = 'Debe seleccionar un tratamiento'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos')
      return
    }

    setLoading(true)
    try {
      await api.procedures.create({
        patient_id: patientId,
        treatment_id: treatmentId!,
        chair_id: chairId!,
        tooth_fdi: toothFdi.trim() || undefined,
        tooth_surface: toothSurface || undefined,
        description: description.trim() || undefined,
      })

      Alert.alert(
        'Éxito',
        'Procedimiento agregado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      )
    } catch (error: any) {
      console.error('Error creating procedure:', error)
      const errorMessage = error.response?.data?.message || 'Error al crear el procedimiento'
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandTurquoise} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.pickerContainer}>
            <HelperText type="info" style={styles.label}>
              Cátedra *
            </HelperText>
            <Menu
              visible={chairMenuVisible}
              onDismiss={() => setChairMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={[styles.menuButton, errors.chairId && styles.menuButtonError]}
                  onPress={() => setChairMenuVisible(true)}
                >
                  <AppText style={styles.menuButtonText}>
                    {chairId ? chairs.find(c => c.id === chairId)?.name : 'Seleccione una cátedra'}
                  </AppText>
                </TouchableOpacity>
              }
            >
              {chairs.map((chair) => (
                <Menu.Item
                  key={chair.id}
                  onPress={() => handleChairChange(chair.id)}
                  title={chair.name}
                />
              ))}
            </Menu>
            {errors.chairId && <HelperText type="error">{errors.chairId}</HelperText>}
          </View>

          <View style={styles.pickerContainer}>
            <HelperText type="info" style={styles.label}>
              Tratamiento *
            </HelperText>
            <Menu
              visible={treatmentMenuVisible}
              onDismiss={() => setTreatmentMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={[styles.menuButton, errors.treatmentId && styles.menuButtonError]}
                  onPress={() => setTreatmentMenuVisible(true)}
                >
                  <AppText style={styles.menuButtonText}>
                    {treatmentId ? filteredTreatments.find(t => t.id === treatmentId)?.name : 'Seleccione un tratamiento'}
                  </AppText>
                </TouchableOpacity>
              }
            >
              {filteredTreatments.length === 0 ? (
                <Menu.Item
                  title={chairId ? 'No hay tratamientos para esta cátedra' : 'Primero seleccione una cátedra'}
                  disabled
                />
              ) : (
                filteredTreatments.map((treatment) => (
                  <Menu.Item
                    key={treatment.id}
                    onPress={() => {
                      setTreatmentId(treatment.id)
                      setTreatmentMenuVisible(false)
                    }}
                    title={treatment.name}
                  />
                ))
              )}
            </Menu>
            {errors.treatmentId && <HelperText type="error">{errors.treatmentId}</HelperText>}
          </View>

          <TextInput
            label="Diente FDI (ej: 36)"
            value={toothFdi}
            onChangeText={setToothFdi}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            maxLength={2}
          />

          <View style={styles.pickerContainer}>
            <HelperText type="info" style={styles.label}>Superficie (opcional)</HelperText>
            <View style={styles.surfaceRow}>
              {TOOTH_SURFACES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.surfaceChip,
                    toothSurface === s.value && styles.surfaceChipSelected,
                  ]}
                  onPress={() => setToothSurface(toothSurface === s.value ? '' : s.value)}
                >
                  <AppText style={[
                    styles.surfaceChipText,
                    toothSurface === s.value && styles.surfaceChipTextSelected,
                  ]}>{s.label}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Agregue notas o detalles adicionales sobre el procedimiento"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
          >
            Crear Procedimiento
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  menuButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.white,
    padding: spacing.md,
    minHeight: 56,
    justifyContent: 'center',
  },
  menuButtonError: {
    borderColor: colors.error,
  },
  menuButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  submitButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  surfaceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  surfaceChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F9FAFB',
  },
  surfaceChipSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  surfaceChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  surfaceChipTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600' as const,
  },
})
