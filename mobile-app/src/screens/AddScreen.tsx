import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Surface, IconButton } from 'react-native-paper'
import { AppText, AppButton } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface Assignment {
  id: number
  patient_procedure: {
    id: number
    treatment: {
      id: number
      name: string
    }
    chair: {
      id: number
      name: string
    }
    patient: {
      id: number
      full_name: string
    }
  }
  status: string
}

export default function AddScreen() {
  const navigation = useNavigation<any>()
  const [showProcedureModal, setShowProcedureModal] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchActiveAssignments = async () => {
    setLoading(true)
    try {
      const response = await api.students.getMyAssignments()
      const activeAssignments = (response.data.data || []).filter(
        (a: Assignment) => a.status === 'activa'
      )
      setAssignments(activeAssignments)
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenProcedureModal = () => {
    fetchActiveAssignments()
    setShowProcedureModal(true)
  }

  const handleSelectAssignment = (assignment: Assignment) => {
    setShowProcedureModal(false)
    navigation.navigate('PatientDetail', { 
      patientId: assignment.patient_procedure.patient.id,
      assignmentId: assignment.id 
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppText variant="h2" color="brandNavy" weight="bold">
          Agregar
        </AppText>
        <AppText color="textMuted" style={styles.description}>
          Selecciona qué deseas agregar
        </AppText>
        
        <View style={styles.buttonContainer}>
          <AppButton
            title="Agregar Paciente"
            onPress={() => navigation.navigate('CreatePatient' as never)}
            variant="primary"
            fullWidth
            style={styles.button}
          />
          <AppButton
            title="Registrar Procedimiento"
            onPress={handleOpenProcedureModal}
            variant="secondary"
            fullWidth
            style={styles.button}
          />
        </View>
      </View>

      <Modal
        visible={showProcedureModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProcedureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="bold" color="brandNavy">
                Mis Procedimientos En Curso
              </AppText>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowProcedureModal(false)}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brandNavy} />
                <AppText color="textMuted" style={styles.loadingText}>
                  Cargando procedimientos...
                </AppText>
              </View>
            ) : assignments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AppText color="textMuted" style={styles.emptyText}>
                  No tienes procedimientos en curso.
                </AppText>
                <AppText color="textMuted" style={styles.emptySubtext}>
                  Busca pacientes disponibles en la sección de Cátedras.
                </AppText>
              </View>
            ) : (
              <ScrollView style={styles.assignmentsList}>
                {assignments.map((assignment) => (
                  <TouchableOpacity
                    key={assignment.id}
                    style={styles.assignmentItem}
                    onPress={() => handleSelectAssignment(assignment)}
                  >
                    <View style={styles.assignmentInfo}>
                      <AppText weight="semibold" color="brandNavy">
                        {assignment.patient_procedure.patient.full_name}
                      </AppText>
                      <AppText variant="caption" color="textMuted">
                        {assignment.patient_procedure.treatment.name}
                      </AppText>
                      <AppText variant="caption" color="brandTurquoise">
                        {assignment.patient_procedure.chair.name}
                      </AppText>
                    </View>
                    <IconButton icon="chevron-right" size={24} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  description: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    marginBottom: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  assignmentsList: {
    maxHeight: 400,
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  assignmentInfo: {
    flex: 1,
  },
})
