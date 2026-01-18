import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, AppCard } from '../components/ui'
import { AppHeader } from '../components/AppHeader'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

const treatments = [
  'CIRUGÍA SIMPLE',
  'ENDODONCIA',
  'PERIODONCIA',
  'ORTODONCIA',
  'PRÓTESIS',
]

const patients = [
  {
    id: 1,
    name: 'Cármen Herrera',
    age: 20,
    city: 'Villarrica',
    university: 'Universidad del Norte',
    disponibles: 3,
    enProceso: 3,
    finalizados: 3,
    treatments: ['CIRUGÍA SIMPLE', 'ENDODONCIA'],
  },
  {
    id: 2,
    name: 'María González',
    age: 25,
    city: 'Asunción',
    university: 'Universidad del Norte',
    disponibles: 2,
    enProceso: 1,
    finalizados: 4,
    treatments: ['PERIODONCIA', 'PRÓTESIS'],
  },
  {
    id: 3,
    name: 'Juan Pérez',
    age: 30,
    city: 'Encarnación',
    university: 'Universidad del Norte',
    disponibles: 1,
    enProceso: 2,
    finalizados: 2,
    treatments: ['CIRUGÍA SIMPLE', 'ORTODONCIA'],
  },
  {
    id: 4,
    name: 'Ana Martínez',
    age: 22,
    city: 'Ciudad del Este',
    university: 'Universidad del Norte',
    disponibles: 4,
    enProceso: 0,
    finalizados: 1,
    treatments: ['ENDODONCIA', 'PRÓTESIS'],
  },
  {
    id: 5,
    name: 'Pedro Rodríguez',
    age: 28,
    city: 'Villarrica',
    university: 'Universidad del Norte',
    disponibles: 2,
    enProceso: 3,
    finalizados: 3,
    treatments: ['CIRUGÍA SIMPLE', 'PERIODONCIA'],
  },
]

export default function ChairPatientsScreen({ route, navigation }: any) {
  const chairName = route?.params?.chairName || 'Cirugías'
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([])

  const handleMenuPress = () => {
    console.log('Abrir menú')
  }

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
  }, [selectedTreatments])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <AppHeader onMenuPress={handleMenuPress} />

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
          {treatments.map((treatment, index) => {
            const isSelected = selectedTreatments.includes(treatment)
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.treatmentChip,
                  isSelected && styles.treatmentChipSelected
                ]}
                onPress={() => toggleTreatment(treatment)}
              >
                <AppText 
                  color={isSelected ? 'white' : 'brandNavy'} 
                  weight="medium" 
                  style={styles.treatmentText}
                >
                  {treatment}
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
      </ScrollView>
    </SafeAreaView>
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
})
