import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface TreatmentSession {
  id: number
  session_number: number
  session_date: string
  notes: string | null
  status: 'programada' | 'completada' | 'cancelada'
  creator?: { id: number; name: string }
}

type AssignmentStatus = 'activa' | 'completada' | 'abandonada'

interface AssignmentDetail {
  id: number
  status: AssignmentStatus
  sessions_completed: number
  notes?: string
  assigned_at: string
  updated_at: string
  completed_at?: string
  abandoned_at?: string
  patient_procedure: {
    id: number
    treatment: {
      id: number
      name: string
      description: string
      estimated_sessions: number
    }
    chair: {
      id: number
      name: string
    }
    patient: {
      id: number
      full_name: string
      email: string
      phone: string
      city: string
      birth_date: string
    }
  }
}

const STATUS_CONFIG = {
  activa: {
    label: 'En Proceso',
    color: colors.success,
    bgColor: '#E8F5E9',
    icon: 'medical' as const,
  },
  completada: {
    label: 'Completada',
    color: colors.brandNavy,
    bgColor: '#E3F2FD',
    icon: 'checkmark-circle' as const,
  },
  abandonada: {
    label: 'Abandonada',
    color: colors.error,
    bgColor: '#FFEBEE',
    icon: 'close-circle' as const,
  },
}

export default function AssignmentDetailScreen({ route, navigation }: any) {
  const { assignmentId } = route.params
  const queryClient = useQueryClient()
  
  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [abandonModalVisible, setAbandonModalVisible] = useState(false)
  const [finalNotes, setFinalNotes] = useState('')
  const [abandonReason, setAbandonReason] = useState('')
  
  // Session management states
  const [sessions, setSessions] = useState<TreatmentSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [addSessionModalVisible, setAddSessionModalVisible] = useState(false)
  const [editSessionModalVisible, setEditSessionModalVisible] = useState(false)
  const [selectedSession, setSelectedSession] = useState<TreatmentSession | null>(null)
  const [sessionDate, setSessionDate] = useState(new Date())
  const [sessionNotes, setSessionNotes] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [savingSession, setSavingSession] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const response = await api.students.getAssignmentDetail(assignmentId)
      return response.data.data
    },
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      return await api.students.completeAssignment(assignmentId, { final_notes: finalNotes })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] })
      setCompleteModalVisible(false)
      setFinalNotes('')
      Alert.alert(
        'Éxito',
        'Tratamiento completado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      )
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo completar el tratamiento')
    },
  })

  const abandonMutation = useMutation({
    mutationFn: async () => {
      return await api.students.abandonAssignment(assignmentId, { reason: abandonReason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] })
      setAbandonModalVisible(false)
      setAbandonReason('')
      Alert.alert(
        'Caso Abandonado',
        'El caso ha sido abandonado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      )
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo abandonar el caso')
    },
  })

  const handleComplete = () => {
    setCompleteModalVisible(true)
  }

  const handleAbandon = () => {
    setAbandonModalVisible(true)
  }

  const confirmComplete = () => {
    completeMutation.mutate()
  }

  const confirmAbandon = () => {
    if (!abandonReason.trim()) {
      Alert.alert('Error', 'Debes proporcionar un motivo para abandonar el caso')
      return
    }
    abandonMutation.mutate()
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`)
  }

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`)
  }

  // Load sessions when data is available
  useEffect(() => {
    if (data?.id) {
      loadSessions()
    }
  }, [data?.id])

  const loadSessions = async () => {
    try {
      setSessionsLoading(true)
      const response = await api.treatmentSessions.list(assignmentId)
      setSessions(response.data.data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleAddSession = () => {
    setSessionDate(new Date())
    setSessionNotes('')
    setAddSessionModalVisible(true)
  }

  const handleEditSession = (session: TreatmentSession) => {
    setSelectedSession(session)
    setSessionDate(new Date(session.session_date))
    setSessionNotes(session.notes || '')
    setEditSessionModalVisible(true)
  }

  const handleDeleteSession = (session: TreatmentSession) => {
    Alert.alert(
      'Eliminar Sesión',
      `¿Estás seguro de eliminar la sesión #${session.session_number}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.treatmentSessions.delete(session.id)
              loadSessions()
              queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
              Alert.alert('Éxito', 'Sesión eliminada')
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar')
            }
          }
        }
      ]
    )
  }

  const saveNewSession = async () => {
    setSavingSession(true)
    try {
      await api.treatmentSessions.create(assignmentId, {
        session_date: sessionDate.toISOString(),
        notes: sessionNotes || undefined,
        status: 'completada',
      })
      setAddSessionModalVisible(false)
      loadSessions()
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      Alert.alert('Éxito', 'Sesión registrada correctamente')
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar la sesión')
    } finally {
      setSavingSession(false)
    }
  }

  const updateSession = async () => {
    if (!selectedSession) return
    setSavingSession(true)
    try {
      await api.treatmentSessions.update(selectedSession.id, {
        session_date: sessionDate.toISOString(),
        notes: sessionNotes || undefined,
      })
      setEditSessionModalVisible(false)
      loadSessions()
      Alert.alert('Éxito', 'Sesión actualizada')
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar')
    } finally {
      setSavingSession(false)
    }
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      const newDate = new Date(sessionDate)
      newDate.setFullYear(selectedDate.getFullYear())
      newDate.setMonth(selectedDate.getMonth())
      newDate.setDate(selectedDate.getDate())
      setSessionDate(newDate)
    }
  }

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false)
    if (selectedTime) {
      const newDate = new Date(sessionDate)
      newDate.setHours(selectedTime.getHours())
      newDate.setMinutes(selectedTime.getMinutes())
      setSessionDate(newDate)
    }
  }

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <AppText variant="body" color="textSecondary">
            Cargando información...
          </AppText>
        </View>
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
          <AppText variant="h3" color="error" style={{ marginTop: spacing.md }}>
            Error al cargar
          </AppText>
          <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            No se pudo cargar la información de la asignación
          </AppText>
        </View>
      </View>
    )
  }

  const statusConfig = STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.activa
  const progress = (data.sessions_completed / data.patient_procedure.treatment.estimated_sessions) * 100
  const age = new Date().getFullYear() - new Date(data.patient_procedure.patient.birth_date).getFullYear()

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.brandNavy} />
          </TouchableOpacity>
          <AppText variant="h2" weight="bold" color="brandNavy">
            Detalle de Asignación
          </AppText>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
          <AppText variant="body" weight="semibold" style={{ color: statusConfig.color, marginLeft: 8 }}>
            {statusConfig.label}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>
            Información del Paciente
          </AppText>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">
                  Nombre completo
                </AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">
                  {data.patient_procedure.patient.full_name}
                </AppText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">
                  Edad
                </AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">
                  {age} años
                </AppText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">
                  Ciudad
                </AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">
                  {data.patient_procedure.patient.city}
                </AppText>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.contactButton} onPress={() => handleCall(data.patient_procedure.patient.phone)}>
              <Ionicons name="call" size={20} color={colors.brandTurquoise} />
              <AppText variant="body" color="brandTurquoise" style={{ marginLeft: spacing.sm }}>
                {data.patient_procedure.patient.phone}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={() => handleEmail(data.patient_procedure.patient.email)}>
              <Ionicons name="mail" size={20} color={colors.brandTurquoise} />
              <AppText variant="body" color="brandTurquoise" style={{ marginLeft: spacing.sm }}>
                {data.patient_procedure.patient.email}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>
            Tratamiento
          </AppText>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="medical" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">
                  Procedimiento
                </AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">
                  {data.patient_procedure.treatment.name}
                </AppText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="school" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">
                  Cátedra
                </AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">
                  {data.patient_procedure.chair.name}
                </AppText>
              </View>
            </View>

            <View style={styles.descriptionBox}>
              <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.xs }}>
                Descripción
              </AppText>
              <AppText variant="body" color="brandNavy">
                {data.patient_procedure.treatment.description}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>
            Progreso
          </AppText>

          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <AppText variant="body" color="textSecondary">
                Sesiones completadas
              </AppText>
              <AppText variant="h3" weight="bold" color="brandNavy">
                {data.sessions_completed}/{data.patient_procedure.treatment.estimated_sessions}
              </AppText>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>

            <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
              {Math.round(progress)}% completado
            </AppText>
          </View>
        </View>

        {/* Sessions Section */}
        <View style={styles.section}>
          <View style={styles.sessionsSectionHeader}>
            <AppText variant="h3" weight="bold" color="brandNavy">
              Historial de Sesiones
            </AppText>
            {data.status === 'activa' && (
              <TouchableOpacity style={styles.addSessionButton} onPress={handleAddSession}>
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <AppText style={styles.addSessionButtonText}>Registrar</AppText>
              </TouchableOpacity>
            )}
          </View>

          {sessionsLoading ? (
            <View style={styles.sessionsLoadingContainer}>
              <ActivityIndicator size="small" color={colors.brandTurquoise} />
            </View>
          ) : sessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {sessions.map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionNumberBadge}>
                      <AppText style={styles.sessionNumberText}>#{session.session_number}</AppText>
                    </View>
                    <AppText variant="body" weight="semibold" color="brandNavy">
                      {formatSessionDate(session.session_date)}
                    </AppText>
                    {data.status === 'activa' && (
                      <View style={styles.sessionActions}>
                        <TouchableOpacity onPress={() => handleEditSession(session)} style={styles.sessionActionButton}>
                          <Ionicons name="pencil" size={16} color={colors.brandTurquoise} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteSession(session)} style={styles.sessionActionButton}>
                          <Ionicons name="trash" size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  {session.notes && (
                    <AppText variant="caption" color="textSecondary" style={styles.sessionNotes}>
                      {session.notes}
                    </AppText>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noSessionsContainer}>
              <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
              <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                No hay sesiones registradas
              </AppText>
              {data.status === 'activa' && (
                <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.xs }}>
                  Toca "Registrar" para agregar una sesión
                </AppText>
              )}
            </View>
          )}
        </View>

        {data.notes && (
          <View style={styles.section}>
            <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>
              Notas Clínicas
            </AppText>

            <View style={styles.notesCard}>
              <AppText variant="body" color="brandNavy">
                {data.notes}
              </AppText>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>
            Fechas
          </AppText>

          <View style={styles.card}>
            <View style={styles.dateRow}>
              <AppText variant="caption" color="textSecondary">
                Asignado
              </AppText>
              <AppText variant="body" weight="semibold" color="brandNavy">
                {new Date(data.assigned_at).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </AppText>
            </View>

            <View style={styles.dateRow}>
              <AppText variant="caption" color="textSecondary">
                Última actualización
              </AppText>
              <AppText variant="body" weight="semibold" color="brandNavy">
                {new Date(data.updated_at).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </AppText>
            </View>

            {data.completed_at && (
              <View style={styles.dateRow}>
                <AppText variant="caption" color="textSecondary">
                  Completado
                </AppText>
                <AppText variant="body" weight="semibold" color="success">
                  {new Date(data.completed_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </AppText>
              </View>
            )}

            {data.abandoned_at && (
              <View style={styles.dateRow}>
                <AppText variant="caption" color="textSecondary">
                  Abandonado
                </AppText>
                <AppText variant="body" weight="semibold" color="error">
                  {new Date(data.abandoned_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {data.status === 'activa' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.odontogramButton}
              onPress={() => navigation.navigate('Odontogram', { 
                patientId: data.patient_procedure.patient.id,
                assignmentId: data.id,
                isPediatric: !!data.patient_procedure.patient.is_pediatric,
              })}
            >
              <Ionicons name="medical" size={20} color={colors.brandTurquoise} />
              <AppText style={styles.odontogramButtonText}>Ver Odontograma</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('ProcedureView', { 
                procedureId: data.patient_procedure.id,
                assignmentId: data.id,
                canEdit: true
              })}
            >
              <Ionicons name="create-outline" size={20} color={colors.brandNavy} />
              <AppText style={styles.editButtonText}>Editar Tratamiento</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <AppText style={styles.completeButtonText}>Completar Tratamiento</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.abandonButton}
              onPress={handleAbandon}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <AppText style={styles.abandonButtonText}>Abandonar Caso</AppText>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Modal para Completar Tratamiento */}
      <Modal
        visible={completeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCompleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Completar Tratamiento</AppText>
            <AppText style={styles.modalDescription}>
              ¿Estás seguro de que deseas marcar este tratamiento como completado?
            </AppText>

            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Notas Finales (Opcional)</AppText>
              <TextInput
                style={styles.textArea}
                value={finalNotes}
                onChangeText={setFinalNotes}
                placeholder="Agrega observaciones finales sobre el tratamiento..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setCompleteModalVisible(false)
                  setFinalNotes('')
                }}
                disabled={completeMutation.isPending}
              >
                <AppText style={styles.modalCancelText}>Cancelar</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmComplete}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText style={styles.modalConfirmText}>Confirmar</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Abandonar Caso */}
      <Modal
        visible={abandonModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAbandonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Abandonar Caso</AppText>
            <AppText style={styles.modalDescription}>
              ¿Estás seguro de que deseas abandonar este caso?
            </AppText>

            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Motivo *</AppText>
              <TextInput
                style={styles.textArea}
                value={abandonReason}
                onChangeText={setAbandonReason}
                placeholder="Explica el motivo del abandono..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setAbandonModalVisible(false)
                  setAbandonReason('')
                }}
                disabled={abandonMutation.isPending}
              >
                <AppText style={styles.modalCancelText}>Cancelar</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalDangerButton]}
                onPress={confirmAbandon}
                disabled={abandonMutation.isPending}
              >
                {abandonMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText style={styles.modalConfirmText}>Abandonar</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Agregar Sesión */}
      <Modal
        visible={addSessionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddSessionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Registrar Sesión</AppText>
            <AppText style={styles.modalDescription}>
              Registra una nueva sesión de tratamiento
            </AppText>

            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Fecha y Hora</AppText>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={18} color={colors.brandTurquoise} />
                  <AppText style={styles.dateTimeButtonText}>
                    {sessionDate.toLocaleDateString('es-ES')}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={18} color={colors.brandTurquoise} />
                  <AppText style={styles.dateTimeButtonText}>
                    {sessionDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={sessionDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={sessionDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Notas (Opcional)</AppText>
              <TextInput
                style={styles.textArea}
                value={sessionNotes}
                onChangeText={setSessionNotes}
                placeholder="Observaciones de la sesión..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setAddSessionModalVisible(false)}
                disabled={savingSession}
              >
                <AppText style={styles.modalCancelText}>Cancelar</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={saveNewSession}
                disabled={savingSession}
              >
                {savingSession ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText style={styles.modalConfirmText}>Guardar</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Editar Sesión */}
      <Modal
        visible={editSessionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditSessionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Editar Sesión #{selectedSession?.session_number}</AppText>

            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Fecha y Hora</AppText>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={18} color={colors.brandTurquoise} />
                  <AppText style={styles.dateTimeButtonText}>
                    {sessionDate.toLocaleDateString('es-ES')}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={18} color={colors.brandTurquoise} />
                  <AppText style={styles.dateTimeButtonText}>
                    {sessionDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={sessionDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={sessionDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Notas (Opcional)</AppText>
              <TextInput
                style={styles.textArea}
                value={sessionNotes}
                onChangeText={setSessionNotes}
                placeholder="Observaciones de la sesión..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditSessionModalVisible(false)}
                disabled={savingSession}
              >
                <AppText style={styles.modalCancelText}>Cancelar</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={updateSession}
                disabled={savingSession}
              >
                {savingSession ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText style={styles.modalConfirmText}>Actualizar</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  descriptionBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brandTurquoise,
    borderRadius: 4,
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandTurquoise,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionsSection: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  abandonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  abandonButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  odontogramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.brandTurquoise,
  },
  odontogramButtonText: {
    color: colors.brandTurquoise,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.brandNavy,
  },
  editButtonText: {
    color: colors.brandNavy,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.brandNavy,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brandNavy,
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 14,
    color: colors.brandNavy,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalConfirmButton: {
    backgroundColor: colors.success,
  },
  modalDangerButton: {
    backgroundColor: colors.error,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  addSessionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  sessionsLoadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  sessionsList: {
    gap: spacing.sm,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandTurquoise,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionNumberBadge: {
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sessionNumberText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: spacing.xs,
  },
  sessionActionButton: {
    padding: spacing.xs,
  },
  sessionNotes: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noSessionsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  dateTimeButtonText: {
    color: colors.brandNavy,
    fontSize: 14,
    fontWeight: '500',
  },
})
