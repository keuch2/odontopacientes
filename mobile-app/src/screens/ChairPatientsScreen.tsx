import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { AppText } from '../components/ui'
import { ToothPickerModal } from '../components/ToothPickerModal'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface Treatment {
  id: number
  name: string
  code: string
  subclasses?: Array<{ id: number; name: string }>
}

interface PatientData {
  id: number
  name: string
  age: number
  city: string
  university: string
  disponibles: number
  enProceso: number
  finalizados: number
  treatments: string[]
  isPediatric: boolean
}

export default function ChairPatientsScreen({ route, navigation }: any) {
  const chairId = route?.params?.chairId
  const chairName = route?.params?.chairName || 'Cátedra'
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([])
  const [selectedSubclassId, setSelectedSubclassId] = useState<number | null>(null)
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [toothModalVisible, setToothModalVisible] = useState(false)

  // Cargar detalles de la cátedra (incluye tratamientos con subclases)
  const { data: chairData, isLoading: chairLoading } = useQuery({
    queryKey: ['chair', chairId],
    queryFn: async () => {
      if (!chairId) return null
      const response = await api.chairs.get(chairId)
      return response.data.data
    },
    enabled: !!chairId,
  })

  // Cargar pacientes de esta cátedra (reactivo a filtros de servidor)
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients-by-chair', chairId, selectedTooth, selectedSubclassId],
    queryFn: async () => {
      const params: any = { chair_id: chairId, per_page: 100 }
      if (selectedTooth) params.tooth_fdi = selectedTooth
      if (selectedSubclassId) params.treatment_subclass_id = selectedSubclassId
      const response = await api.patients.search(params)
      return response.data.data || []
    },
    enabled: !!chairId,
  })

  // Obtener lista de tratamientos de la cátedra (con subclases)
  const treatments: Treatment[] = chairData?.treatments || []

  // Transformar pacientes al formato esperado
  const patients: PatientData[] = useMemo(() => {
    return (patientsData || []).map((patient: any) => ({
      id: patient.id,
      name: patient.full_name || patient.name,
      age: patient.age || 0,
      city: patient.city || '',
      university: patient.faculty?.name || '',
      disponibles: patient.procedures_available || patient.procedures_count?.disponible || 0,
      enProceso: patient.procedures_in_progress || patient.procedures_count?.proceso || 0,
      finalizados: patient.procedures_completed || patient.procedures_count?.finalizado || 0,
      treatments: patient.treatments?.map((t: any) => t.name) || [],
      isPediatric: !!patient.is_pediatric,
    }))
  }, [patientsData])

  const toggleTreatment = (treatmentName: string) => {
    setSelectedSubclassId(null)
    setSelectedTreatments(prev => {
      if (prev.includes(treatmentName)) {
        return prev.filter(t => t !== treatmentName)
      }
      return [...prev, treatmentName]
    })
  }

  // Subclases disponibles cuando se selecciona exactamente 1 tratamiento
  const availableSubclasses = useMemo(() => {
    if (selectedTreatments.length !== 1) return []
    const treatment = treatments.find(t => t.name === selectedTreatments[0])
    return treatment?.subclasses || []
  }, [selectedTreatments, treatments])

  // Filtro client-side por tratamiento
  const filteredPatients = useMemo(() => {
    if (selectedTreatments.length === 0) {
      return patients
    }
    return patients.filter(patient =>
      selectedTreatments.some(treatment => patient.treatments.includes(treatment))
    )
  }, [selectedTreatments, patients])

  const isLoading = chairLoading || patientsLoading

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Título y botón volver */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={24} color={colors.brandNavy} />
          </TouchableOpacity>
          <AppText variant="h2" color="brandNavy" weight="bold">
            {chairName}
          </AppText>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brandTurquoise} />
            <AppText color="textSecondary" style={styles.loadingText}>
              Cargando pacientes...
            </AppText>
          </View>
        ) : (
          <>
            {/* Filtro por tratamientos */}
            <AppText color="brandNavy" weight="semibold" style={styles.filterTitle}>
              Filtrar por tratamientos
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipScrollContent}
            >
              {treatments.map((treatment) => {
                const isSelected = selectedTreatments.includes(treatment.name)
                return (
                  <TouchableOpacity
                    key={treatment.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleTreatment(treatment.name)}
                  >
                    <AppText
                      color={isSelected ? 'white' : 'brandNavy'}
                      weight="medium"
                      style={styles.chipText}
                    >
                      {treatment.name}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* Filtro por subclase (aparece solo cuando hay subclases disponibles) */}
            {availableSubclasses.length > 0 && (
              <>
                <AppText color="brandNavy" weight="semibold" style={styles.filterTitle}>
                  Sub clase
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                  contentContainerStyle={styles.chipScrollContent}
                >
                  {availableSubclasses.map((subclass) => {
                    const isSelected = selectedSubclassId === subclass.id
                    return (
                      <TouchableOpacity
                        key={subclass.id}
                        style={[styles.chip, styles.chipSubclass, isSelected && styles.chipSubclassSelected]}
                        onPress={() => setSelectedSubclassId(isSelected ? null : subclass.id)}
                      >
                        <AppText
                          color={isSelected ? 'white' : 'brandNavy'}
                          weight="medium"
                          style={styles.chipText}
                        >
                          {subclass.name}
                        </AppText>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              </>
            )}

            {/* Filtro por diente */}
            <View style={styles.toothFilterRow}>
              <TouchableOpacity
                style={[styles.toothChip, selectedTooth && styles.toothChipActive]}
                onPress={() => setToothModalVisible(true)}
              >
                <Ionicons name="medical" size={14} color={selectedTooth ? colors.white : colors.brandNavy} />
                <AppText
                  color={selectedTooth ? 'white' : 'brandNavy'}
                  weight="semibold"
                  style={styles.toothChipText}
                >
                  {selectedTooth ? `Diente #${selectedTooth}` : 'Filtrar por diente'}
                </AppText>
                {selectedTooth && (
                  <TouchableOpacity
                    onPress={() => setSelectedTooth(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.white} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Contador de resultados */}
            <View style={styles.resultsCounter}>
              <AppText color="textMuted" style={styles.resultsText}>
                {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
              </AppText>
            </View>

            {/* Lista de pacientes */}
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.patientCard}
                  onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="h3" color="brandNavy" weight="bold">
                        {patient.name}
                      </AppText>
                    </View>
                    {patient.isPediatric && (
                      <View style={styles.pediatricBadge}>
                        <AppText color="white" weight="semibold" style={styles.pediatricText}>Pediátrico</AppText>
                      </View>
                    )}
                  </View>
                  <AppText color="textSecondary" style={styles.patientInfo}>
                    {patient.age} años • {patient.city}{patient.university ? ` • ${patient.university}` : ''}
                  </AppText>
                  <View style={styles.statusContainer}>
                    <View style={styles.statusBadge}>
                      <AppText color="white" weight="semibold" style={styles.statusText}>
                        {patient.disponibles} disponibles
                      </AppText>
                    </View>
                    <View style={[styles.statusBadge, styles.statusBadgeGray]}>
                      <AppText color="brandNavy" weight="semibold" style={styles.statusText}>
                        {patient.enProceso} en proceso
                      </AppText>
                    </View>
                    <View style={[styles.statusBadge, styles.statusBadgeGreen]}>
                      <AppText color="white" weight="semibold" style={styles.statusText}>
                        {patient.finalizados} finalizados
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <AppText color="textMuted" align="center" style={styles.emptyText}>
                  No se encontraron pacientes con los filtros seleccionados
                </AppText>
              </View>
            )}

            <View style={styles.spacer} />
          </>
        )}
      </ScrollView>

      <ToothPickerModal
        visible={toothModalVisible}
        onClose={() => setToothModalVisible(false)}
        selectedTooth={selectedTooth}
        onToothChange={setSelectedTooth}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backArrow: {
    padding: spacing.xs,
  },
  filterTitle: {
    marginBottom: spacing.sm,
  },
  chipScroll: {
    marginBottom: spacing.md,
  },
  chipScrollContent: {
    paddingRight: spacing.lg,
  },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  chipSubclass: {
    borderColor: colors.brandTurquoise,
  },
  chipSubclassSelected: {
    backgroundColor: colors.brandTurquoise,
    borderColor: colors.brandTurquoise,
  },
  chipText: {
    fontSize: 12,
  },
  toothFilterRow: {
    marginBottom: spacing.md,
  },
  toothChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brandNavy,
    backgroundColor: colors.white,
  },
  toothChipActive: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  toothChipText: {
    fontSize: 12,
    marginLeft: 4,
  },
  resultsCounter: {
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  resultsText: {
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
  },
  patientCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  pediatricBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pediatricText: {
    fontSize: 10,
  },
  patientInfo: {
    marginBottom: spacing.md,
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusBadge: {
    backgroundColor: colors.brandNavy,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  statusBadgeGray: {
    backgroundColor: '#E0E0E0',
  },
  statusBadgeGreen: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
  },
  spacer: {
    height: spacing.xxl,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
})
