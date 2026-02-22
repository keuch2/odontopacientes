import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { AppText, AppCard } from './ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

interface PatientCardProps {
  patient: {
    id: number
    name: string
    age: number
    city: string
    university: string
    disponibles: number
    enProceso: number
    finalizados: number
  }
  onPress?: () => void
}

export function PatientCard({ patient, onPress }: PatientCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
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
  )
}

const styles = StyleSheet.create({
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
})
