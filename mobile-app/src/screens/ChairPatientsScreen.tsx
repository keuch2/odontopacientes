import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { AppText, AppCard } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface Treatment {
  id: number
  name: string
  code: string
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
}

export default function ChairPatientsScreen({ route, navigation }: any) {
  const chairId = route?.params?.chairId
  const chairName = route?.params?.chairName || 'Cátedra'
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([])

  // Cargar detalles de la cátedra (incluye tratamientos)
  const { data: chairData, isLoading: chairLoading } = useQuery({
    queryKey: ['chair', chairId],
    queryFn: async () => {
      if (!chairId) return null
      const response = await api.chairs.get(chairId)
      return response.data.data
    },
    enabled: !!chairId,
  })

  // Cargar pacientes de esta cátedra
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients-by-chair', chairId],
    queryFn: async () => {
      const response = await api.patients.search({ chair_id: chairId, per_page: 100 })
      return response.data.data || []
    },
    enabled: !!chairId,
  })

  // Obtener lista de tratamientos de la cátedra
  const treatments: Treatment[] = chairData?.treatments || []

  // Transformar pacientes al formato esperado
  const patients: PatientData[] = useMemo(() => {
    return (patientsData || []).map((patient: any) => ({
      id: patient.id,
      name: patient.full_name || patient.name,
      age: patient.age || 0,
      city: patient.city || '',
      university: patient.faculty?.name || '',
      disponibles: patient.procedures_available || 0,
      enProceso: patient.procedures_in_progress || 0,
      finalizados: patient.procedures_completed || 0,
      treatments: patient.treatments?.map((t: any) => t.name) || [],
    }))
  }, [patientsData])

  const toggleTreatment = (treatment: string) => {
    setSelectedTreatments(prev => {
      if (prev.includes(treatment)) {
        return prev.filter(t => t !== treatment)
      }
      return [...prev, treatment]
    })
  }

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
        <View style={styles.titleContainer}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            {chairName}
          </AppText>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AppText color="white" weight="semibold">Volver</AppText>
          </TouchableOpacity>
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
            {/* Filtros de tratamiento */}
            <AppText color="brandNavy" weight="semibold" style={styles.filterTitle}>
              Filtrar por tratamientos
            </AppText>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.treatmentScroll}
          contentContainerStyle={styles.treatmentScrollContent}
        >
          {treatments.map((treatment) => {
            const isSelected = selectedTreatments.includes(treatment.name)
            return (
              <TouchableOpacity 
                key={treatment.id} 
                style={[
                  styles.treatmentChip,
                  isSelected && styles.treatmentChipSelected
                ]}
                onPress={() => toggleTreatment(treatment.name)}
              >
                <AppText 
                  color={isSelected ? 'white' : 'brandNavy'} 
                  weight="medium" 
                  style={styles.treatmentText}
                >
                  {treatment.name}
                </AppText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

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
            onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
          >
            <AppCard style={styles.patientCard} padding="lg">
              <AppText variant="h3" color="white" weight="bold" style={styles.patientName}>
                {patient.name}
              </AppText>
              <AppText color="white" style={styles.patientInfo}>
                {patient.age} años • {patient.city} • {patient.university}
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
            </AppCard>
          </TouchableOpacity>
        ))
        ) : (
          <View style={styles.emptyState}>
            <AppText color="textMuted" align="center" style={styles.emptyText}>
              No se encontraron pacientes con los tratamientos seleccionados
            </AppText>
          </View>
          )}

            <View style={styles.spacer} />
          </>
        )}
      </ScrollView>
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  backButton: {
    backgroundColor: colors.brandNavy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  filterTitle: {
    marginBottom: spacing.sm,
  },
  treatmentScroll: {
    marginBottom: spacing.lg,
  },
  treatmentScrollContent: {
    paddingRight: spacing.lg,
  },
  treatmentChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  treatmentChipSelected: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  treatmentText: {
    fontSize: 12,
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
    backgroundColor: colors.brandTurquoise,
    marginBottom: spacing.md,
  },
  patientName: {
    marginBottom: spacing.xs,
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
