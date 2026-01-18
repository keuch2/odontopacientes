import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppText, AppButton } from '../components/ui'
import { AppHeader } from '../components/AppHeader'
import Odontogram, { ToothData } from '../components/Odontogram'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

type TabType = 'disponible' | 'proceso' | 'finalizado'

export default function PatientDetailScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('disponible')

  const handleMenuPress = () => {
    console.log('Abrir menú')
  }

  // Mock data del paciente
  const patient = {
    id: 1,
    name: 'Cármen Herrera',
    age: 20,
    gender: 'Femenino',
    city: 'Villarrica',
    university: 'Universidad del Norte',
    address: 'Calle Sin Nombre, 0000, Villarrica',
    document: '99297652',
    phone: '0981675387',
    email: 'carmenherrera@gmail.com',
    civilStatus: 'Casada',
    weight: '80 kg',
    height: '1.65',
    admissionDate: '16/10/2024',
    anamnesis: [
      'Tiene dolores',
      'Tiene nervios por el procedimiento',
      'Tuvo una mala experiencia',
      'Se ha hospitalizado',
      'Fue atendido/a en los últimos años por un médico',
      'Ha tomado medicamentos (Ibuprofeno, Aspirina)',
      'Es alérgico/a (Penicilina)',
      'Tuvo una hemorragia excesiva',
      'Está embarazada',
      'Tiene asma',
      'Es fumador',
      'Suele crujir los dientes',
    ],
  }

  // Mock data de procedimientos
  const allProcedures = [
    {
      id: 1,
      name: 'CIRUGÍA EI (17)',
      status: 'finalizado' as const,
      date: '15/11/2025',
    },
    {
      id: 2,
      name: 'ENDODONCIA (24)',
      status: 'proceso' as const,
      date: '20/11/2025',
    },
    {
      id: 3,
      name: 'PRÓTESIS FIJA (11-21)',
      status: 'disponible' as const,
      date: null,
    },
    {
      id: 4,
      name: 'OPERATORIA (36)',
      status: 'disponible' as const,
      date: null,
    },
    {
      id: 5,
      name: 'PERIODONCIA (46)',
      status: 'proceso' as const,
      date: '22/11/2025',
    },
    {
      id: 6,
      name: 'CIRUGÍA ED (48)',
      status: 'finalizado' as const,
      date: '10/11/2025',
    },
  ]

  const filteredProcedures = allProcedures.filter(p => p.status === activeTab)

  const procedureCounts = {
    disponible: allProcedures.filter(p => p.status === 'disponible').length,
    proceso: allProcedures.filter(p => p.status === 'proceso').length,
    finalizado: allProcedures.filter(p => p.status === 'finalizado').length,
  }

  // Verificar si el alumno tiene al menos un procedimiento activo con este paciente
  const hasActiveProcedure = allProcedures.some(p => p.status === 'proceso')

  const handleCall = () => {
    Linking.openURL(`tel:${patient.phone}`)
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola ${patient.name}, te contacto desde OdontoPacientes`)
    Linking.openURL(`whatsapp://send?phone=595${patient.phone.replace(/^0/, '')}&text=${message}`)
  }

  // Mock data del odontograma
  const odontogramData: ToothData[] = [
    { number: 17, status: 'caries', notes: 'Caries oclusal' },
    { number: 24, status: 'root_canal', notes: 'Endodoncia en proceso' },
    { number: 36, status: 'filled', notes: 'Obturación de amalgama' },
    { number: 46, status: 'filled', notes: 'Obturación de resina' },
    { number: 48, status: 'extracted', notes: 'Extraído hace 2 años' },
  ]

  const handleToothPress = (toothNumber: number) => {
    console.log('Diente seleccionado:', toothNumber)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado':
        return colors.success
      case 'proceso':
        return colors.warning
      case 'disponible':
        return colors.brandTurquoise
      default:
        return colors.textMuted
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finalizado':
        return 'Finalizado'
      case 'proceso':
        return 'En Proceso'
      case 'disponible':
        return 'Disponible'
      default:
        return status
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader onMenuPress={handleMenuPress} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Ficha Paciente
          </AppText>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.addProcedureButton}
              onPress={() => navigation.navigate('CreateProcedure' as never, { patientId: patient.id } as never)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.white} />
              <AppText color="white" weight="semibold" style={styles.buttonText}>Agregar Procedimiento</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditPatient' as never, { patientId: patient.id } as never)}
            >
              <Ionicons name="create-outline" size={20} color={colors.white} />
              <AppText color="white" weight="semibold" style={styles.buttonText}>Editar</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <AppText color="white" weight="semibold">Volver</AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.patientCard}>
          <View style={styles.patientCardHeader}>
            <View style={styles.patientInfo}>
              <AppText variant="h3" color="white" weight="bold">{patient.name}</AppText>
              <AppText color="white" style={styles.patientMeta}>Edad: {patient.age} años</AppText>
              <AppText color="white" style={styles.patientMeta}>Género: {patient.gender}</AppText>
              <AppText color="white" style={styles.patientMeta}>Registrado en: {patient.university}</AppText>
            </View>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={handleCall}>
                <Ionicons name="call" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Dirección</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.address}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Cédula de Identidad</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.document}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Teléfono</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.phone}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Email</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.email}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Estado Civil</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.civilStatus}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Peso</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.weight}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Estatura</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.height}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Fecha de Admisión</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.admissionDate}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="h3" color="brandNavy" weight="bold" style={styles.sectionTitle}>
            Anamnésis
          </AppText>
          {patient.anamnesis.map((item, index) => (
            <AppText key={index} color="textMuted" style={styles.anamnesisItem}>• {item}</AppText>
          ))}
        </View>

        <View style={styles.section}>
          <AppText variant="h3" color="brandNavy" weight="bold" style={styles.sectionTitle}>
            Tipo de Mordida
          </AppText>
          <AppText color="textMuted">Clase 1</AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3" color="brandNavy" weight="bold">
              Odontograma
            </AppText>
            {hasActiveProcedure && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate('Odontogram' as never)}
              >
                <AppText color="white" weight="semibold">Editar</AppText>
              </TouchableOpacity>
            )}
          </View>
          <Odontogram 
            teeth={odontogramData} 
            onToothPress={handleToothPress}
            editable={false}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="h3" color="brandNavy" weight="bold" style={styles.sectionTitle}>
            Procedimientos
          </AppText>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'disponible' && styles.tabActive]}
              onPress={() => setActiveTab('disponible')}
            >
              <AppText
                color={activeTab === 'disponible' ? 'white' : 'brandNavy'}
                weight="semibold"
                style={styles.tabText}
              >
                Disponibles ({procedureCounts.disponible})
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'proceso' && styles.tabActive]}
              onPress={() => setActiveTab('proceso')}
            >
              <AppText
                color={activeTab === 'proceso' ? 'white' : 'brandNavy'}
                weight="semibold"
                style={styles.tabText}
              >
                En Proceso ({procedureCounts.proceso})
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'finalizado' && styles.tabActive]}
              onPress={() => setActiveTab('finalizado')}
            >
              <AppText
                color={activeTab === 'finalizado' ? 'white' : 'brandNavy'}
                weight="semibold"
                style={styles.tabText}
              >
                Finalizados ({procedureCounts.finalizado})
              </AppText>
            </TouchableOpacity>
          </View>

          {filteredProcedures.length > 0 ? (
            filteredProcedures.map((procedure) => (
              <TouchableOpacity
                key={procedure.id}
                style={styles.procedureCard}
                onPress={() => {
                  if (procedure.status === 'finalizado' || procedure.status === 'proceso') {
                    navigation.navigate('ProcedureView', { procedureId: procedure.id })
                  }
                }}
              >
                <View style={styles.procedureHeader}>
                  <AppText variant="body" color="brandNavy" weight="bold">
                    {procedure.name}
                  </AppText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(procedure.status) }]}>
                    <AppText color="white" style={styles.statusText}>
                      {getStatusText(procedure.status)}
                    </AppText>
                  </View>
                </View>
                {procedure.date && (
                  <AppText color="textMuted" style={styles.procedureDate}>
                    Fecha: {procedure.date}
                  </AppText>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <AppText color="textMuted" align="center">
                No hay procedimientos {activeTab === 'disponible' ? 'disponibles' : activeTab === 'proceso' ? 'en proceso' : 'finalizados'}
              </AppText>
            </View>
          )}

          {activeTab === 'disponible' && (
            <AppButton
              title="Agendar Nuevo Procedimiento"
              onPress={() => navigation.navigate('ProcedureSchedule', { patientId: 1 })}
              style={styles.scheduleButton}
            />
          )}
        </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandTurquoise,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: 18,
  },
  menuButton: {
    padding: spacing.sm,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: '100%',
    height: 3,
    backgroundColor: colors.brandNavy,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addProcedureButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  buttonText: {
    marginLeft: 4,
  },
  backButton: {
    backgroundColor: colors.brandNavy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  patientCard: {
    backgroundColor: colors.brandTurquoise,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  patientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flex: 1,
  },
  patientMeta: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
  contactButtons: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: 14,
  },
  anamnesisItem: {
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.brandNavy,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  tabText: {
    fontSize: 12,
  },
  emptyState: {
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  procedureCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  procedureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  procedureDate: {
    fontSize: 13,
  },
  scheduleButton: {
    marginTop: spacing.md,
  },
  spacer: {
    height: spacing.xxl,
  },
})
