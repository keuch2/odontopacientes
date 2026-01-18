import React, { useState } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../store/auth'
import { AppText } from '../components/ui'
import { AppHeader } from '../components/AppHeader'
import { SearchBar } from '../components/SearchBar'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

interface Appointment {
  id: number
  treatment: string
  toothNumber?: string
  patient: string
  date?: string
  time: string
  location: string
}

const todayAppointments: Appointment[] = [
  {
    id: 1,
    treatment: 'CIRUGÍA',
    toothNumber: '17',
    patient: 'Cármen Herrera',
    time: '18:00 hs',
    location: 'Universidad del Norte',
  },
]

const weekAppointments: Appointment[] = [
  {
    id: 2,
    treatment: 'CIRUGÍA',
    toothNumber: '17',
    patient: 'Cármen Herrera',
    date: 'Jueves 18 de Septiembre, 2025',
    time: '18:00 hs',
    location: 'Universidad del Norte',
  },
  {
    id: 3,
    treatment: 'ENDODONCIA',
    toothNumber: '24',
    patient: 'Juan Pérez',
    date: 'Viernes 19 de Septiembre, 2025',
    time: '14:30 hs',
    location: 'Universidad del Norte',
  },
]

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore()
  const [searchText, setSearchText] = useState('')

  const handleMenuPress = () => {
    console.log('Abrir menú')
  }

  const handleReschedule = (appointmentId: number) => {
    console.log('Reagendar cita:', appointmentId)
    // TODO: Implementar lógica de reagendamiento
  }

  const handleEditProfile = () => {
    console.log('Editar perfil')
    // TODO: Navegar a pantalla de edición de perfil
  }

  const renderAppointmentCard = (appointment: Appointment, showDate: boolean = false) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentInfo}>
        <AppText variant="h3" color="brandNavy" weight="bold" style={styles.appointmentTitle}>
          {appointment.treatment}{appointment.toothNumber ? ` El (${appointment.toothNumber})` : ''}
        </AppText>
        <AppText variant="body" color="textMuted" style={styles.appointmentDetail}>
          <AppText weight="semibold" color="brandNavy">Paciente:</AppText> {appointment.patient}
        </AppText>
        {showDate && appointment.date && (
          <AppText variant="body" color="textMuted" style={styles.appointmentDetail}>
            <AppText weight="semibold" color="brandNavy">Fecha:</AppText> {appointment.date}
          </AppText>
        )}
        <AppText variant="body" color="textMuted" style={styles.appointmentDetail}>
          <AppText weight="semibold" color="brandNavy">Horario:</AppText> {appointment.time}
        </AppText>
        <AppText variant="body" color="textMuted" style={styles.appointmentDetail}>
          <AppText weight="semibold" color="brandNavy">Lugar:</AppText> {appointment.location}
        </AppText>
      </View>
      <TouchableOpacity 
        style={styles.reagendarButton}
        onPress={() => handleReschedule(appointment.id)}
      >
        <AppText variant="body" color="white" weight="semibold">
          Reagendar
        </AppText>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <AppHeader onMenuPress={handleMenuPress} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Barra de búsqueda */}
        <View style={styles.searchWrapper}>
          <SearchBar 
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Contenedor principal */}
        <View style={styles.contentContainer}>
          {/* Saludo */}
          <AppText variant="h2" color="brandNavy" weight="bold" style={styles.greeting}>
            Hola {user?.name || 'Dr. Bruno Acuña'}
          </AppText>

          {/* Card Hoy */}
          {todayAppointments.length > 0 ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AppText variant="h3" color="white" weight="semibold">
                  Hoy
                </AppText>
              </View>
              {todayAppointments.map(appointment => renderAppointmentCard(appointment, false))}
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AppText variant="h3" color="white" weight="semibold">
                  Hoy
                </AppText>
              </View>
              <View style={styles.emptyState}>
                <AppText color="textMuted" align="center">
                  No tienes citas programadas para hoy
                </AppText>
              </View>
            </View>
          )}

          {/* Card Esta Semana */}
          {weekAppointments.length > 0 ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AppText variant="h3" color="white" weight="semibold">
                  Esta Semana
                </AppText>
              </View>
              {weekAppointments.map(appointment => renderAppointmentCard(appointment, true))}
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AppText variant="h3" color="white" weight="semibold">
                  Esta Semana
                </AppText>
              </View>
              <View style={styles.emptyState}>
                <AppText color="textMuted" align="center">
                  No tienes citas programadas para esta semana
                </AppText>
              </View>
            </View>
          )}

          {/* Botón Editar Perfil */}
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <AppText variant="h3" color="white" weight="semibold">
              Editar mi Perfil
            </AppText>
          </TouchableOpacity>

          <View style={styles.spacer} />
        </View>
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
  },
  searchWrapper: {
    backgroundColor: colors.white,
    paddingBottom: spacing.sm,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
  },
  greeting: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionCard: {
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  sectionHeader: {
    backgroundColor: colors.brandNavy,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  appointmentCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emptyState: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    alignItems: 'center',
  },
  appointmentInfo: {
    marginBottom: spacing.md,
  },
  appointmentTitle: {
    marginBottom: spacing.xs,
  },
  appointmentDetail: {
    marginBottom: 4,
  },
  reagendarButton: {
    backgroundColor: colors.brandNavy,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  editProfileButton: {
    backgroundColor: colors.brandTurquoise,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  spacer: {
    height: spacing.xxl,
  },
})
