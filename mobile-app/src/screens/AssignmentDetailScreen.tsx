import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, TextInput, Alert, ActivityIndicator, Platform, Image } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'

interface ProcedurePhoto {
  id: number
  url: string
  file_name: string
  description: string | null
  formatted_size: string
  created_at: string
  created_by: { id: number; name: string }
}

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
    chair: { id: number; name: string }
    patient: {
      id: number
      full_name: string
      email: string
      phone: string
      city: string
      birth_date: string
      is_pediatric?: boolean
    }
  }
}

const STATUS_CONFIG = {
  activa: { label: 'En Proceso', color: colors.success, bgColor: '#E8F5E9', icon: 'medical' as const },
  completada: { label: 'Completada', color: colors.brandNavy, bgColor: '#E3F2FD', icon: 'checkmark-circle' as const },
  abandonada: { label: 'Abandonada', color: colors.error, bgColor: '#FFEBEE', icon: 'close-circle' as const },
}

export default function AssignmentDetailScreen({ route, navigation }: any) {
  const { assignmentId, procedureId: routeProcedureId } = route.params || {}
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Assignment states
  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [abandonModalVisible, setAbandonModalVisible] = useState(false)
  const [finalNotes, setFinalNotes] = useState('')
  const [abandonReason, setAbandonReason] = useState('')

  // Session states
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

  // Procedure states (from ProcedureViewScreen)
  const [procedure, setProcedure] = useState<any>(null)
  const [procedureLoading, setProcedureLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Photos states
  const [photos, setPhotos] = useState<ProcedurePhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<ProcedurePhoto | null>(null)
  const [photoModalVisible, setPhotoModalVisible] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newDescription, setNewDescription] = useState('')

  // Edit procedure states
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editChairId, setEditChairId] = useState<number | null>(null)
  const [editTreatmentId, setEditTreatmentId] = useState<number | null>(null)
  const [editSubclassId, setEditSubclassId] = useState<number | null>(null)
  const [editOptionId, setEditOptionId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [chairs, setChairs] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [savingEdit, setSavingEdit] = useState(false)

  // Fetch assignment data (when assignmentId provided)
  const { data: assignmentData, isLoading: assignmentLoading, error: assignmentError } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const response = await api.students.getAssignmentDetail(assignmentId)
      return response.data.data as AssignmentDetail
    },
    enabled: !!assignmentId,
  })

  // Derive the procedure ID
  const procedureId = routeProcedureId || assignmentData?.patient_procedure?.id

  // Fetch procedure details
  const fetchProcedureDetails = async () => {
    if (!procedureId) return
    try {
      setProcedureLoading(true)
      const response = await api.procedures.get(procedureId)
      setProcedure(response.data.data)
    } catch (error: any) {
      console.error('Error loading procedure:', error)
    } finally {
      setProcedureLoading(false)
    }
  }

  useEffect(() => {
    if (procedureId) fetchProcedureDetails()
  }, [procedureId])

  // Fetch photos
  const fetchPhotos = async () => {
    if (!procedureId) return
    try {
      setPhotosLoading(true)
      const response = await api.procedurePhotos.listByProcedure(procedureId)
      setPhotos(response.data.data || [])
    } catch (error: any) {
      console.error('Error loading photos:', error)
    } finally {
      setPhotosLoading(false)
    }
  }

  useEffect(() => {
    if (procedure) fetchPhotos()
  }, [procedure?.id])

  // Derive effective assignmentId (from route or from procedure data)
  const effectiveAssignmentId = assignmentId || procedure?.assignment?.id

  // Load sessions
  useEffect(() => {
    if (effectiveAssignmentId) loadSessions()
  }, [effectiveAssignmentId])

  const loadSessions = async () => {
    if (!effectiveAssignmentId) return
    try {
      setSessionsLoading(true)
      const response = await api.treatmentSessions.list(effectiveAssignmentId)
      setSessions(response.data.data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setSessionsLoading(false)
    }
  }

  // Mutations
  const completeMutation = useMutation({
    mutationFn: async () => {
      return await api.students.completeAssignment(effectiveAssignmentId, { final_notes: finalNotes })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] })
      setCompleteModalVisible(false)
      setFinalNotes('')
      fetchProcedureDetails()
      Alert.alert('Éxito', 'Tratamiento completado exitosamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo completar el tratamiento')
    },
  })

  const abandonMutation = useMutation({
    mutationFn: async () => {
      return await api.students.abandonAssignment(effectiveAssignmentId, { reason: abandonReason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] })
      setAbandonModalVisible(false)
      setAbandonReason('')
      fetchProcedureDetails()
      Alert.alert('Caso Abandonado', 'El caso ha sido abandonado exitosamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo abandonar el caso')
    },
  })

  // Helpers
  const isUserAssigned = () => {
    const studentId = procedure?.assignment?.student?.id || assignmentData?.id
    return studentId != null && user?.id != null && (procedure?.assignment?.student?.id === user.id)
  }

  const isUserCreator = () => {
    const createdById = typeof procedure?.created_by === 'object' ? procedure?.created_by?.id : procedure?.created_by
    return createdById != null && createdById === user?.id
  }

  const canEditPhotos = () => {
    if (isUserCreator()) return true
    return isUserAssigned() && (procedure?.status === 'proceso' || procedure?.status === 'finalizado')
  }

  const canEdit = () => {
    return procedure?.status === 'disponible' || procedure?.status === 'contraindicado'
  }

  // Determine effective status and patient info based on data sources
  const hasAssignment = !!assignmentData || !!procedure?.assignment
  const assignmentStatus = assignmentData?.status || (procedure?.assignment ? 'activa' : null)
  const isAssignmentActive = assignmentStatus === 'activa'

  const patientName = assignmentData?.patient_procedure?.patient?.full_name || procedure?.patient?.full_name || 'Paciente'
  const patientPhone = assignmentData?.patient_procedure?.patient?.phone || procedure?.patient?.phone || ''
  const patientEmail = assignmentData?.patient_procedure?.patient?.email || procedure?.patient?.email || ''
  const patientCity = assignmentData?.patient_procedure?.patient?.city || procedure?.patient?.city || ''
  const patientBirthDate = assignmentData?.patient_procedure?.patient?.birth_date || procedure?.patient?.birth_date
  const patientId = assignmentData?.patient_procedure?.patient?.id || procedure?.patient?.id
  const patientAge = patientBirthDate ? new Date().getFullYear() - new Date(patientBirthDate).getFullYear() : procedure?.patient?.age || 0

  const treatmentName = procedure?.treatment?.name || assignmentData?.patient_procedure?.treatment?.name || ''
  const chairName = procedure?.chair?.name || assignmentData?.patient_procedure?.chair?.name || ''
  const treatmentDescription = procedure?.description || assignmentData?.patient_procedure?.treatment?.description || ''
  const estimatedSessions = procedure?.treatment?.estimated_sessions || assignmentData?.patient_procedure?.treatment?.estimated_sessions || 1
  const sessionsCompleted = assignmentData?.sessions_completed || sessions.length

  // Procedure status
  const procedureStatus = procedure?.status || (assignmentStatus === 'activa' ? 'proceso' : assignmentStatus === 'completada' ? 'finalizado' : 'disponible')

  // Handlers
  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`)
  const handleEmail = (email: string) => Linking.openURL(`mailto:${email}`)

  const handleComplete = () => setCompleteModalVisible(true)
  const handleAbandon = () => setAbandonModalVisible(true)
  const confirmComplete = () => completeMutation.mutate()
  const confirmAbandon = () => {
    if (!abandonReason.trim()) {
      Alert.alert('Error', 'Debes proporcionar un motivo para abandonar el caso')
      return
    }
    abandonMutation.mutate()
  }

  // Assign procedure
  const handleAssign = () => {
    Alert.alert('Asignarme Procedimiento', '¿Estás seguro que deseas asignarte este procedimiento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Asignarme',
        onPress: async () => {
          try {
            setActionLoading(true)
            await api.procedures.assign(procedureId)
            Alert.alert('Éxito', 'Procedimiento asignado correctamente')
            fetchProcedureDetails()
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo asignar')
          } finally {
            setActionLoading(false)
          }
        },
      },
    ])
  }

  // Cancel procedure
  const handleCancel = () => {
    Alert.alert('Cancelar Procedimiento', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, Cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true)
            await api.procedures.cancel(procedureId)
            Alert.alert('Éxito', 'Procedimiento cancelado')
            fetchProcedureDetails()
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo cancelar')
          } finally {
            setActionLoading(false)
          }
        },
      },
    ])
  }

  // Session handlers
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
    Alert.alert('Eliminar Sesión', `¿Estás seguro de eliminar la sesión #${session.session_number}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.treatmentSessions.delete(session.id)
            loadSessions()
            if (assignmentId) queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
            Alert.alert('Éxito', 'Sesión eliminada')
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar')
          }
        },
      },
    ])
  }

  const saveNewSession = async () => {
    setSavingSession(true)
    try {
      await api.treatmentSessions.create(effectiveAssignmentId, {
        session_date: sessionDate.toISOString(),
        notes: sessionNotes || undefined,
        status: 'completada',
      })
      setAddSessionModalVisible(false)
      loadSessions()
      if (assignmentId) queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      fetchProcedureDetails()
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

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      const newDate = new Date(sessionDate)
      newDate.setFullYear(selectedDate.getFullYear())
      newDate.setMonth(selectedDate.getMonth())
      newDate.setDate(selectedDate.getDate())
      setSessionDate(newDate)
    }
  }

  const onTimeChange = (_event: any, selectedTime?: Date) => {
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
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  // Photo handlers
  const showPhotoOptions = () => {
    Alert.alert('Agregar Foto', 'Selecciona una opción', [
      { text: 'Cámara', onPress: () => captureAndUploadImage('camera') },
      { text: 'Galería', onPress: () => captureAndUploadImage('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  const captureAndUploadImage = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara'); return }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería'); return }
    }
    const isCamera = source === 'camera'
    const pickerFn = isCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync
    const result = await pickerFn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: isCamera,
      allowsMultipleSelection: !isCamera,
      quality: 0.8,
      base64: true,
    })
    if (!result.canceled && result.assets.length > 0) {
      const validAssets = result.assets.filter(a => a.base64)
      if (validAssets.length === 0) return
      setUploadingPhoto(true)
      let uploaded = 0, failed = 0
      try {
        for (const asset of validAssets) {
          try {
            const base64Image = `data:image/jpeg;base64,${asset.base64}`
            if (effectiveAssignmentId && isUserAssigned()) {
              await api.procedurePhotos.uploadBase64(effectiveAssignmentId, { image: base64Image })
            } else {
              await api.procedurePhotos.uploadBase64ByProcedure(procedureId, { image: base64Image })
            }
            uploaded++
          } catch { failed++ }
        }
        if (failed > 0) Alert.alert('Resultado', `${uploaded} foto(s) subida(s), ${failed} fallida(s)`)
        else Alert.alert('Éxito', uploaded === 1 ? 'Foto subida correctamente' : `${uploaded} fotos subidas correctamente`)
        fetchPhotos()
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'No se pudieron subir las fotos')
      } finally {
        setUploadingPhoto(false)
      }
    }
  }

  const handleDeletePhoto = (photo: ProcedurePhoto) => {
    Alert.alert('Eliminar Foto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.procedurePhotos.delete(photo.id)
            setPhotos(photos.filter(p => p.id !== photo.id))
            setPhotoModalVisible(false)
            setSelectedPhoto(null)
            Alert.alert('Éxito', 'Foto eliminada correctamente')
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar')
          }
        },
      },
    ])
  }

  const handleUpdateDescription = async () => {
    if (!selectedPhoto) return
    try {
      await api.procedurePhotos.update(selectedPhoto.id, { description: newDescription })
      setPhotos(photos.map(p => p.id === selectedPhoto.id ? { ...p, description: newDescription } : p))
      setSelectedPhoto({ ...selectedPhoto, description: newDescription })
      setEditingDescription(false)
      Alert.alert('Éxito', 'Descripción actualizada')
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar')
    }
  }

  const openPhotoModal = (photo: ProcedurePhoto) => {
    setSelectedPhoto(photo)
    setNewDescription(photo.description || '')
    setPhotoModalVisible(true)
  }

  // Edit procedure handlers
  const openEditModal = async () => {
    setEditChairId(procedure?.chair?.id || null)
    setEditTreatmentId(procedure?.treatment?.id || null)
    setEditSubclassId(procedure?.treatment_subclass?.id || null)
    setEditOptionId(procedure?.treatment_subclass_option?.id || null)
    setEditNotes(procedure?.notes || '')
    try {
      const chairsRes = await api.chairs.list()
      setChairs(chairsRes.data.data || [])
      if (procedure?.chair?.id) {
        const treatmentsRes = await api.treatments.list({ chair_id: procedure.chair.id })
        setTreatments(treatmentsRes.data.data || [])
      }
    } catch (e) { console.error('Error loading edit data:', e) }
    setEditModalVisible(true)
  }

  const handleChairChange = async (chairId: number) => {
    setEditChairId(chairId)
    setEditTreatmentId(null)
    setEditSubclassId(null)
    setEditOptionId(null)
    try {
      const res = await api.treatments.list({ chair_id: chairId })
      setTreatments(res.data.data || [])
    } catch (e) { console.error('Error loading treatments:', e) }
  }

  const handleSaveEdit = async () => {
    if (!editChairId || !editTreatmentId) {
      Alert.alert('Error', 'Selecciona cátedra y tratamiento')
      return
    }
    setSavingEdit(true)
    try {
      await api.procedures.update(procedureId, {
        chair_id: editChairId,
        treatment_id: editTreatmentId,
        treatment_subclass_id: editSubclassId,
        treatment_subclass_option_id: editOptionId,
        notes: editNotes.trim() || undefined,
      })
      Alert.alert('Éxito', 'Procedimiento actualizado')
      setEditModalVisible(false)
      fetchProcedureDetails()
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar')
    } finally {
      setSavingEdit(false)
    }
  }

  // Loading
  const isLoading = (assignmentId ? assignmentLoading : false) || procedureLoading
  if (isLoading && !assignmentData && !procedure) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandTurquoise} />
          <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
            Cargando información...
          </AppText>
        </View>
      </View>
    )
  }

  if ((assignmentId && assignmentError) || (!assignmentData && !procedure)) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
          <AppText variant="h3" color="error" style={{ marginTop: spacing.md }}>Error al cargar</AppText>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
            <AppText color="white" weight="semibold">Volver</AppText>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Status config for assignment
  const statusConfig = assignmentData
    ? STATUS_CONFIG[assignmentData.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.activa
    : null

  const progress = estimatedSessions > 0 ? (sessionsCompleted / estimatedSessions) * 100 : 0

  // Procedure status badge config
  const getProcedureStatusConfig = () => {
    switch (procedureStatus) {
      case 'disponible': return { label: 'Disponible', bgColor: colors.success, icon: 'ellipse' as const }
      case 'proceso': return { label: 'En Proceso', bgColor: colors.warning, icon: 'time' as const }
      case 'finalizado': return { label: 'Finalizado', bgColor: colors.brandTurquoise, icon: 'checkmark-circle' as const }
      case 'contraindicado': return { label: 'Contraindicado', bgColor: colors.error, icon: 'close-circle' as const }
      case 'cancelado': return { label: 'Cancelado', bgColor: '#6B7280', icon: 'ban' as const }
      default: return { label: procedureStatus, bgColor: colors.textMuted, icon: 'ellipse' as const }
    }
  }

  const procStatusConfig = getProcedureStatusConfig()

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.brandNavy} />
          </TouchableOpacity>
          <AppText variant="h2" weight="bold" color="brandNavy">
            Procedimiento
          </AppText>
        </View>

        {/* Action buttons for unassigned procedures */}
        {procedureStatus === 'disponible' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={handleAssign}
            disabled={actionLoading}
          >
            {actionLoading ? <ActivityIndicator size="small" color={colors.white} /> : (
              <>
                <Ionicons name="person-add" size={20} color={colors.white} />
                <AppText color="white" weight="semibold" style={{ marginLeft: spacing.sm }}>ASIGNARME</AppText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Cancel button for creator */}
        {isUserCreator() && procedureStatus !== 'finalizado' && procedureStatus !== 'cancelado' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#DC2626', marginBottom: spacing.md }]}
            onPress={handleCancel}
            disabled={actionLoading}
          >
            {actionLoading ? <ActivityIndicator size="small" color={colors.white} /> : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={colors.white} />
                <AppText color="white" weight="semibold" style={{ marginLeft: spacing.sm }}>CANCELAR PROCEDIMIENTO</AppText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig?.bgColor || procStatusConfig.bgColor + '33' }]}>
          <Ionicons
            name={statusConfig?.icon || procStatusConfig.icon}
            size={20}
            color={statusConfig?.color || procStatusConfig.bgColor}
          />
          <AppText variant="body" weight="semibold" style={{ color: statusConfig?.color || procStatusConfig.bgColor, marginLeft: 8 }}>
            {statusConfig?.label || procStatusConfig.label}
          </AppText>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>
            Información del Paciente
          </AppText>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">Nombre completo</AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">{patientName}</AppText>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">Edad</AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">{patientAge} años</AppText>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">Ciudad</AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">{patientCity}</AppText>
              </View>
            </View>
            <View style={styles.divider} />
            {patientPhone ? (
              <TouchableOpacity style={styles.contactButton} onPress={() => handleCall(patientPhone)}>
                <Ionicons name="call" size={20} color={colors.brandTurquoise} />
                <AppText variant="body" color="brandTurquoise" style={{ marginLeft: spacing.sm }}>{patientPhone}</AppText>
              </TouchableOpacity>
            ) : null}
            {patientEmail ? (
              <TouchableOpacity style={styles.contactButton} onPress={() => handleEmail(patientEmail)}>
                <Ionicons name="mail" size={20} color={colors.brandTurquoise} />
                <AppText variant="body" color="brandTurquoise" style={{ marginLeft: spacing.sm }}>{patientEmail}</AppText>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.viewFichaButton}
            onPress={() => navigation.navigate('PatientDetail', { patientId })}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.brandTurquoise} />
            <AppText variant="caption" color="brandTurquoise" weight="semibold" style={{ marginLeft: 6 }}>
              Ver Ficha del Paciente
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Treatment Info */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <AppText variant="h3" weight="bold" color="brandNavy">Tratamiento</AppText>
            {canEdit() && (
              <TouchableOpacity style={styles.editProcedureBtn} onPress={openEditModal}>
                <Ionicons name="pencil" size={16} color={colors.brandNavy} />
                <AppText color="brandNavy" weight="semibold" style={{ marginLeft: 4, fontSize: 12 }}>Editar</AppText>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="medical" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">Procedimiento</AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">{treatmentName}</AppText>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="school" size={20} color={colors.brandTurquoise} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText variant="caption" color="textSecondary">Cátedra</AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">{chairName}</AppText>
              </View>
            </View>
            {procedure?.treatment_subclass && (
              <View style={styles.infoRow}>
                <Ionicons name="layers" size={20} color={colors.brandTurquoise} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <AppText variant="caption" color="textSecondary">Sub-clase</AppText>
                  <AppText variant="body" weight="semibold" color="brandNavy">{procedure.treatment_subclass.name}</AppText>
                </View>
              </View>
            )}
            {procedure?.treatment_subclass_option && (
              <View style={styles.infoRow}>
                <Ionicons name="list" size={20} color={colors.brandTurquoise} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <AppText variant="caption" color="textSecondary">Sub-sub-clase</AppText>
                  <AppText variant="body" weight="semibold" color="brandNavy">{procedure.treatment_subclass_option.name}</AppText>
                </View>
              </View>
            )}
            {treatmentDescription ? (
              <View style={styles.descriptionBox}>
                <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.xs }}>Descripción</AppText>
                <AppText variant="body" color="brandNavy">{treatmentDescription}</AppText>
              </View>
            ) : null}
            {procedure?.assignment?.student && (
              <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
                <AppText color="brandNavy" weight="semibold">Asignado a:</AppText>
                <AppText color="textMuted">{procedure.assignment.student.name}</AppText>
              </View>
            )}
            {procedure?.created_by && (
              <View style={{ marginTop: spacing.sm }}>
                <AppText color="textMuted" style={{ fontSize: 12 }}>
                  Creado por: {typeof procedure.created_by === 'object' ? procedure.created_by.name : ''}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Progress (only when assigned) */}
        {hasAssignment && (
          <View style={styles.section}>
            <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>Progreso</AppText>
            <View style={styles.card}>
              <View style={styles.progressHeader}>
                <AppText variant="body" color="textSecondary">Sesiones completadas</AppText>
                <AppText variant="h3" weight="bold" color="brandNavy">
                  {sessionsCompleted}/{estimatedSessions}
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
        )}

        {/* Sessions (only when assigned) */}
        {hasAssignment && (
          <View style={styles.section}>
            <View style={styles.sessionsSectionHeader}>
              <AppText variant="h3" weight="bold" color="brandNavy">Historial de Sesiones</AppText>
              {isAssignmentActive && isUserAssigned() && (
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
                      {isAssignmentActive && isUserAssigned() && (
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
              </View>
            )}
          </View>
        )}

        {/* Clinical Notes */}
        {assignmentData?.notes && (
          <View style={styles.section}>
            <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>Notas Clínicas</AppText>
            <View style={styles.notesCard}>
              <AppText variant="body" color="brandNavy">{assignmentData.notes}</AppText>
            </View>
          </View>
        )}

        {/* Dates (when assignment) */}
        {assignmentData && (
          <View style={styles.section}>
            <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginBottom: spacing.md }}>Fechas</AppText>
            <View style={styles.card}>
              <View style={styles.dateRow}>
                <AppText variant="caption" color="textSecondary">Asignado</AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">
                  {new Date(assignmentData.assigned_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </AppText>
              </View>
              <View style={styles.dateRow}>
                <AppText variant="caption" color="textSecondary">Última actualización</AppText>
                <AppText variant="body" weight="semibold" color="brandNavy">
                  {new Date(assignmentData.updated_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </AppText>
              </View>
              {assignmentData.completed_at && (
                <View style={styles.dateRow}>
                  <AppText variant="caption" color="textSecondary">Completado</AppText>
                  <AppText variant="body" weight="semibold" color="success">
                    {new Date(assignmentData.completed_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </AppText>
                </View>
              )}
              {assignmentData.abandoned_at && (
                <View style={styles.dateRow}>
                  <AppText variant="caption" color="textSecondary">Abandonado</AppText>
                  <AppText variant="body" weight="semibold" color="error">
                    {new Date(assignmentData.abandoned_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.photosSectionHeader}>
            <AppText variant="h3" weight="bold" color="brandNavy">Fotos del Procedimiento</AppText>
            {canEditPhotos() && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoOptions} disabled={uploadingPhoto}>
                {uploadingPhoto ? <ActivityIndicator size="small" color={colors.white} /> : (
                  <>
                    <Ionicons name="camera-outline" size={18} color={colors.white} />
                    <AppText color="white" weight="semibold" style={{ marginLeft: 6, fontSize: 12 }}>Agregar</AppText>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          {photosLoading ? (
            <View style={styles.photosLoadingContainer}>
              <ActivityIndicator size="small" color={colors.brandTurquoise} />
            </View>
          ) : photos.length > 0 ? (
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                <TouchableOpacity key={photo.id} style={styles.photoThumbnail} onPress={() => openPhotoModal(photo)}>
                  <Image source={{ uri: photo.url }} style={styles.photoImage} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noPhotosContainer}>
              <Ionicons name="images-outline" size={48} color={colors.textSecondary} />
              <AppText color="textMuted" style={styles.noPhotosText}>No hay fotos disponibles</AppText>
              {canEditPhotos() && (
                <AppText color="textMuted" style={{ fontSize: 12, marginTop: 4 }}>
                  Toca "Agregar" para subir fotos del procedimiento
                </AppText>
              )}
            </View>
          )}
        </View>

        {/* Action buttons at bottom */}
        {isAssignmentActive && isUserAssigned() && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.odontogramButton}
              onPress={() => navigation.navigate('Odontogram', {
                patientId,
                assignmentId: effectiveAssignmentId,
                isPediatric: !!assignmentData?.patient_procedure?.patient?.is_pediatric,
              })}
            >
              <Ionicons name="medical" size={20} color={colors.brandTurquoise} />
              <AppText style={styles.odontogramButtonText}>Ver Odontograma</AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <AppText style={styles.completeButtonText}>Completar Tratamiento</AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.abandonButton} onPress={handleAbandon}>
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <AppText style={styles.abandonButtonText}>Abandonar Caso</AppText>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Photo Modal */}
      <Modal visible={photoModalVisible} transparent animationType="fade" onRequestClose={() => setPhotoModalVisible(false)}>
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModalContent}>
            <TouchableOpacity
              style={styles.photoModalCloseButton}
              onPress={() => { setPhotoModalVisible(false); setEditingDescription(false) }}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            {selectedPhoto && (
              <>
                <Image source={{ uri: selectedPhoto.url }} style={styles.photoModalImage} resizeMode="contain" />
                <View style={styles.photoModalInfo}>
                  {editingDescription ? (
                    <View>
                      <TextInput
                        style={styles.descriptionInput}
                        value={newDescription}
                        onChangeText={setNewDescription}
                        placeholder="Agregar descripción..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm }}>
                        <TouchableOpacity style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }} onPress={() => setEditingDescription(false)}>
                          <AppText color="textMuted">Cancelar</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: colors.brandTurquoise, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 }} onPress={handleUpdateDescription}>
                          <AppText color="white" weight="semibold">Guardar</AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <AppText color="white" style={{ marginBottom: 8 }}>{selectedPhoto.description || 'Sin descripción'}</AppText>
                      <AppText color="textMuted" style={{ fontSize: 12 }}>Subida por {selectedPhoto.created_by.name}</AppText>
                      <AppText color="textMuted" style={{ fontSize: 12 }}>{selectedPhoto.formatted_size}</AppText>
                    </>
                  )}
                </View>
                {canEditPhotos() && !editingDescription && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md }}>
                    <TouchableOpacity style={styles.photoActionBtn} onPress={() => setEditingDescription(true)}>
                      <Ionicons name="pencil" size={20} color={colors.white} />
                      <AppText color="white" style={{ marginLeft: 8 }}>Editar</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.photoActionBtn, { backgroundColor: colors.error }]} onPress={() => handleDeletePhoto(selectedPhoto)}>
                      <Ionicons name="trash" size={20} color={colors.white} />
                      <AppText color="white" style={{ marginLeft: 8 }}>Eliminar</AppText>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Complete Modal */}
      <Modal visible={completeModalVisible} transparent animationType="fade" onRequestClose={() => setCompleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Completar Tratamiento</AppText>
            <AppText style={styles.modalDescription}>¿Estás seguro de que deseas marcar este tratamiento como completado?</AppText>
            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Notas Finales (Opcional)</AppText>
              <TextInput style={styles.textArea} value={finalNotes} onChangeText={setFinalNotes} placeholder="Agrega observaciones finales..." multiline numberOfLines={4} textAlignVertical="top" />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => { setCompleteModalVisible(false); setFinalNotes('') }} disabled={completeMutation.isPending}>
                <AppText style={styles.modalCancelText}>Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirmButton]} onPress={confirmComplete} disabled={completeMutation.isPending}>
                {completeMutation.isPending ? <ActivityIndicator color="#fff" /> : <AppText style={styles.modalConfirmText}>Confirmar</AppText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Abandon Modal */}
      <Modal visible={abandonModalVisible} transparent animationType="fade" onRequestClose={() => setAbandonModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Abandonar Caso</AppText>
            <AppText style={styles.modalDescription}>¿Estás seguro de que deseas abandonar este caso?</AppText>
            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Motivo *</AppText>
              <TextInput style={styles.textArea} value={abandonReason} onChangeText={setAbandonReason} placeholder="Explica el motivo del abandono..." multiline numberOfLines={4} textAlignVertical="top" />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => { setAbandonModalVisible(false); setAbandonReason('') }} disabled={abandonMutation.isPending}>
                <AppText style={styles.modalCancelText}>Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalDangerButton]} onPress={confirmAbandon} disabled={abandonMutation.isPending}>
                {abandonMutation.isPending ? <ActivityIndicator color="#fff" /> : <AppText style={styles.modalConfirmText}>Abandonar</AppText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Session Modal */}
      <Modal visible={addSessionModalVisible} transparent animationType="fade" onRequestClose={() => setAddSessionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Registrar Sesión</AppText>
            <AppText style={styles.modalDescription}>Registra una nueva sesión de tratamiento</AppText>
            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Fecha y Hora</AppText>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar" size={18} color={colors.brandTurquoise} />
                  <AppText style={styles.dateTimeButtonText}>{sessionDate.toLocaleDateString('es-ES')}</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time" size={18} color={colors.brandTurquoise} />
                  <AppText style={styles.dateTimeButtonText}>{sessionDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</AppText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Notas (Opcional)</AppText>
              <TextInput style={styles.textArea} value={sessionNotes} onChangeText={setSessionNotes} placeholder="Observaciones de la sesión..." multiline numberOfLines={3} textAlignVertical="top" />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setAddSessionModalVisible(false)} disabled={savingSession}>
                <AppText style={styles.modalCancelText}>Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirmButton]} onPress={saveNewSession} disabled={savingSession}>
                {savingSession ? <ActivityIndicator color="#fff" /> : <AppText style={styles.modalConfirmText}>Guardar</AppText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Session Modal */}
      <Modal visible={editSessionModalVisible} transparent animationType="fade" onRequestClose={() => setEditSessionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Editar Sesión #{selectedSession?.session_number}</AppText>
            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Fecha y Hora</AppText>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar" size={18} color={colors.brandTurquoise} />
                  <AppText style={styles.dateTimeButtonText}>{sessionDate.toLocaleDateString('es-ES')}</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time" size={18} color={colors.brandTurquoise} />
                  <AppText style={styles.dateTimeButtonText}>{sessionDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</AppText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <AppText style={styles.inputLabel}>Notas (Opcional)</AppText>
              <TextInput style={styles.textArea} value={sessionNotes} onChangeText={setSessionNotes} placeholder="Observaciones de la sesión..." multiline numberOfLines={3} textAlignVertical="top" />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setEditSessionModalVisible(false)} disabled={savingSession}>
                <AppText style={styles.modalCancelText}>Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirmButton]} onPress={updateSession} disabled={savingSession}>
                {savingSession ? <ActivityIndicator color="#fff" /> : <AppText style={styles.modalConfirmText}>Actualizar</AppText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Procedure Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <AppText variant="h3" color="brandNavy" weight="bold">Editar Procedimiento</AppText>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.brandNavy} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.editModalBody} showsVerticalScrollIndicator={false}>
              <AppText color="brandNavy" weight="semibold" style={{ marginBottom: 8 }}>Cátedra</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {chairs.map((chair: any) => (
                    <TouchableOpacity
                      key={chair.id}
                      style={[styles.editChip, editChairId === chair.id && styles.editChipActive]}
                      onPress={() => handleChairChange(chair.id)}
                    >
                      <AppText color={editChairId === chair.id ? 'white' : 'brandNavy'} style={{ fontSize: 13 }}>{chair.name}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <AppText color="brandNavy" weight="semibold" style={{ marginBottom: 8 }}>Tratamiento</AppText>
              {treatments.length > 0 ? (
                <View style={{ marginBottom: spacing.md }}>
                  {treatments.map((treatment: any) => (
                    <TouchableOpacity
                      key={treatment.id}
                      style={[styles.editTreatmentItem, editTreatmentId === treatment.id && styles.editTreatmentItemActive]}
                      onPress={() => { setEditTreatmentId(treatment.id); setEditSubclassId(null) }}
                    >
                      <AppText color={editTreatmentId === treatment.id ? 'white' : 'brandNavy'} weight={editTreatmentId === treatment.id ? 'bold' : 'normal'} style={{ fontSize: 14 }}>
                        {treatment.name}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <AppText color="textMuted" style={{ marginBottom: spacing.md, fontSize: 13 }}>Selecciona una cátedra para ver tratamientos</AppText>
              )}

              {editTreatmentId && treatments.find((t: any) => t.id === editTreatmentId)?.subclasses?.length > 0 && (
                <>
                  <AppText color="brandNavy" weight="semibold" style={{ marginBottom: 8 }}>Sub-clase</AppText>
                  <View style={{ marginBottom: spacing.md }}>
                    {treatments.find((t: any) => t.id === editTreatmentId)?.subclasses?.map((sc: any) => (
                      <TouchableOpacity
                        key={sc.id}
                        style={[styles.editTreatmentItem, editSubclassId === sc.id && styles.editTreatmentItemActive]}
                        onPress={() => setEditSubclassId(editSubclassId === sc.id ? null : sc.id)}
                      >
                        <AppText color={editSubclassId === sc.id ? 'white' : 'brandNavy'} weight={editSubclassId === sc.id ? 'bold' : 'normal'} style={{ fontSize: 14 }}>{sc.name}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {editTreatmentId && (() => {
                const selectedTreatment = treatments.find((t: any) => t.id === editTreatmentId)
                const options = selectedTreatment?.options || []
                if (options.length === 0) return null
                return (
                  <>
                    <AppText color="brandNavy" weight="semibold" style={{ marginBottom: 8 }}>Sub-sub-clase</AppText>
                    <View style={{ marginBottom: spacing.md }}>
                      {options.map((opt: any) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.editTreatmentItem, editOptionId === opt.id && styles.editTreatmentItemActive]}
                          onPress={() => setEditOptionId(editOptionId === opt.id ? null : opt.id)}
                        >
                          <AppText color={editOptionId === opt.id ? 'white' : 'brandNavy'} weight={editOptionId === opt.id ? 'bold' : 'normal'} style={{ fontSize: 14 }}>{opt.name}</AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )
              })()}

              <AppText color="brandNavy" weight="semibold" style={{ marginBottom: 8 }}>Notas</AppText>
              <TextInput style={styles.editNotesInput} value={editNotes} onChangeText={setEditNotes} placeholder="Notas del procedimiento..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={3} />
            </ScrollView>
            <View style={styles.editModalFooter}>
              <TouchableOpacity style={styles.editCancelButton} onPress={() => setEditModalVisible(false)}>
                <AppText color="brandNavy" weight="semibold">Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editSaveButton} onPress={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <ActivityIndicator size="small" color={colors.white} /> : <AppText color="white" weight="bold">Guardar</AppText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DateTimePicker in its own Modal to avoid iOS rendering issues inside other modals */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker || showTimePicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => { setShowDatePicker(false); setShowTimePicker(false) }}>
                  <AppText color="error" weight="semibold">Cancelar</AppText>
                </TouchableOpacity>
                <AppText weight="bold" color="brandNavy">{showDatePicker ? 'Seleccionar Fecha' : 'Seleccionar Hora'}</AppText>
                <TouchableOpacity onPress={() => { setShowDatePicker(false); setShowTimePicker(false) }}>
                  <AppText color="brandTurquoise" weight="semibold">Listo</AppText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={sessionDate}
                mode={showDatePicker ? 'date' : 'time'}
                display="spinner"
                onChange={(event: any, date?: Date) => {
                  if (date) {
                    if (showDatePicker) {
                      const newDate = new Date(sessionDate)
                      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
                      setSessionDate(newDate)
                    } else {
                      const newDate = new Date(sessionDate)
                      newDate.setHours(date.getHours(), date.getMinutes())
                      setSessionDate(newDate)
                    }
                  }
                }}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      ) : (
        <>
          {showDatePicker && (
            <DateTimePicker value={sessionDate} mode="date" display="default" onChange={onDateChange} />
          )}
          {showTimePicker && (
            <DateTimePicker value={sessionDate} mode="time" display="default" onChange={onTimeChange} />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  goBackBtn: { backgroundColor: colors.brandNavy, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, marginTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  backButton: { padding: spacing.xs },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  contactButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  viewFichaButton: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: spacing.sm, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.brandTurquoise, borderRadius: 8 },
  descriptionBox: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.background, borderRadius: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brandTurquoise, borderRadius: 4 },
  notesCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.brandTurquoise },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  actionsSection: { marginTop: spacing.md, gap: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: 8, marginBottom: spacing.sm },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, paddingVertical: spacing.md, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  abandonButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, paddingVertical: spacing.md, borderRadius: 12, borderWidth: 2, borderColor: colors.error },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: spacing.sm },
  abandonButtonText: { color: colors.error, fontSize: 16, fontWeight: '600', marginLeft: spacing.sm },
  odontogramButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, paddingVertical: spacing.md, borderRadius: 12, borderWidth: 2, borderColor: colors.brandTurquoise },
  odontogramButtonText: { color: colors.brandTurquoise, fontSize: 16, fontWeight: '600', marginLeft: spacing.sm },
  editProcedureBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F4F8', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.brandNavy },
  // Photos
  photosSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addPhotoButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.brandTurquoise, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  photosLoadingContainer: { padding: spacing.lg, alignItems: 'center' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoThumbnail: { width: '31%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  photoImage: { width: '100%', height: '100%' },
  noPhotosContainer: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.background, borderRadius: 8 },
  noPhotosText: { textAlign: 'center', fontStyle: 'italic', marginTop: spacing.sm },
  // Photo Modal
  photoModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
  photoModalContent: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  photoModalCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: spacing.sm, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 20 },
  photoModalImage: { width: '100%', height: '60%', borderRadius: 8 },
  photoModalInfo: { width: '100%', padding: spacing.md, marginTop: spacing.md },
  photoActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.brandNavy, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 8 },
  descriptionInput: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: colors.white, borderRadius: 8, padding: spacing.md, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.sm },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.brandNavy, marginBottom: spacing.sm, textAlign: 'center' },
  modalDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center', lineHeight: 20 },
  inputContainer: { marginBottom: spacing.lg },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.brandNavy, marginBottom: spacing.sm },
  textArea: { backgroundColor: colors.background, borderRadius: 8, padding: spacing.md, fontSize: 14, color: colors.brandNavy, borderWidth: 1, borderColor: colors.border, minHeight: 100 },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalButton: { flex: 1, paddingVertical: spacing.md, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalCancelButton: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  modalConfirmButton: { backgroundColor: colors.success },
  modalDangerButton: { backgroundColor: colors.error },
  modalCancelText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Sessions
  sessionsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  addSessionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.brandTurquoise, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, gap: 4 },
  addSessionButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  sessionsLoadingContainer: { padding: spacing.lg, alignItems: 'center' },
  sessionsList: { gap: spacing.sm },
  sessionCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.brandTurquoise },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionNumberBadge: { backgroundColor: colors.brandTurquoise, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4 },
  sessionNumberText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  sessionActions: { flexDirection: 'row', marginLeft: 'auto', gap: spacing.xs },
  sessionActionButton: { padding: spacing.xs },
  sessionNotes: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  noSessionsContainer: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.xl, alignItems: 'center' },
  dateTimeRow: { flexDirection: 'row', gap: spacing.sm },
  dateTimeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  dateTimeButtonText: { color: colors.brandNavy, fontSize: 14, fontWeight: '500' },
  // Edit Procedure Modal
  editModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  editModalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: spacing.lg },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  editModalBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  editChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.brandNavy, backgroundColor: colors.white },
  editChipActive: { backgroundColor: colors.brandNavy, borderColor: colors.brandNavy },
  editTreatmentItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xs, backgroundColor: colors.white },
  editTreatmentItemActive: { backgroundColor: colors.brandTurquoise, borderColor: colors.brandTurquoise },
  editNotesInput: { backgroundColor: colors.background, borderRadius: 8, padding: spacing.md, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.md, color: colors.brandNavy, fontSize: 14 },
  editModalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  editCancelButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.brandNavy },
  editSaveButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 8, backgroundColor: colors.brandTurquoise },
})
