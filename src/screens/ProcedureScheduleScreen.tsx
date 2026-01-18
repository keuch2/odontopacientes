import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppText, AppButton } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

export default function ProcedureScheduleScreen({ navigation }: any) {
  const [date, setDate] = useState(new Date())
  const [time, setTime] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios')
    if (selectedTime) {
      setTime(selectedTime)
    }
  }

  const handleSchedule = () => {
    // Aquí iría la lógica para guardar la cita
    console.log('Procedimiento agendado:', { date, time })
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <AppText variant="body" color="white" weight="bold">OP</AppText>
          </View>
          <AppText variant="h3" color="brandTurquoise" weight="bold" style={styles.logoText}>
            OdontoPacientes
          </AppText>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Agendar Procedimiento
          </AppText>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AppText color="white" weight="semibold">Volver</AppText>
          </TouchableOpacity>
        </View>

        {/* Procedure card */}
        <View style={styles.procedureCard}>
          <AppText variant="h3" color="brandNavy" weight="bold" style={styles.procedureTitle}>
            CIRUGÍA EI (17)
          </AppText>
          <AppText color="textMuted" style={styles.procedureDescription}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute 
            irure dolor in
          </AppText>
        </View>

        {/* Date time picker */}
        <View style={styles.dateTimeSection}>
          <AppText color="brandNavy" weight="semibold" style={styles.sectionLabel}>
            Elegir Fecha y Hora
          </AppText>
          
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <AppText color="textSecondary" weight="semibold">📅 Fecha</AppText>
            <AppText color="brandNavy" weight="bold" style={styles.dateTimeValue}>
              {formatDate(date)}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <AppText color="textSecondary" weight="semibold">🕐 Hora</AppText>
            <AppText color="brandNavy" weight="bold" style={styles.dateTimeValue}>
              {formatTime(time)}
            </AppText>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}
        </View>

        {/* Patient info */}
        <View style={styles.patientSection}>
          <AppText color="brandNavy" weight="semibold" style={styles.sectionLabel}>
            Paciente
          </AppText>
          <View style={styles.patientCard}>
            <AppText variant="h3" color="brandNavy" weight="bold">Cármen Herrera</AppText>
            <AppText color="textMuted" style={styles.patientMeta}>Edad: 20 años</AppText>
            <AppText color="textMuted" style={styles.patientMeta}>Ciudad: Villarrica</AppText>
            <AppText color="textMuted" style={styles.patientMeta}>
              Registrado en: Universidad del Norte
            </AppText>
            <TouchableOpacity 
              style={styles.viewFileButton}
              onPress={() => navigation.navigate('PatientDetail')}
            >
              <AppText color="white" weight="semibold" style={styles.viewFileButtonText}>
                Ver Ficha
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <AppButton
          title="Confirmar Agendamiento"
          onPress={handleSchedule}
          fullWidth
          style={styles.confirmButton}
        />

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
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  backButton: {
    backgroundColor: colors.brandNavy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  procedureCard: {
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  procedureTitle: {
    marginBottom: spacing.sm,
  },
  procedureDescription: {
    lineHeight: 20,
  },
  dateTimeSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateTimeButton: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeValue: {
    fontSize: 18,
  },
  confirmButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  patientSection: {
    marginBottom: spacing.lg,
  },
  patientCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
  },
  patientMeta: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
  viewFileButton: {
    backgroundColor: colors.brandNavy,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  viewFileButtonText: {
    fontSize: 14,
  },
  spacer: {
    height: spacing.xxl,
  },
})
