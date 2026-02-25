import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, Pressable, TextInput, Linking } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { AppText, AppButton } from '../components/ui'
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
  created_by: {
    id: number
    name: string
  }
}

interface TreatmentSession {
  id: number
  session_number: number
  session_date: string
  notes: string | null
  status: 'programada' | 'completada' | 'cancelada'
  creator?: { id: number; name: string }
}

export default function ProcedureViewScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { procedureId } = route.params as { procedureId: number }
  const { user } = useAuthStore()

  const [procedure, setProcedure] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [photos, setPhotos] = useState<ProcedurePhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<ProcedurePhoto | null>(null)
  const [photoModalVisible, setPhotoModalVisible] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newDescription, setNewDescription] = useState('')
  const [sessions, setSessions] = useState<TreatmentSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [showAddSession, setShowAddSession] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [savingSession, setSavingSession] = useState(false)
  const [completingProcedure, setCompletingProcedure] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editChairId, setEditChairId] = useState<number | null>(null)
  const [editTreatmentId, setEditTreatmentId] = useState<number | null>(null)
  const [editSubclassId, setEditSubclassId] = useState<number | null>(null)
  const [editOptionId, setEditOptionId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [chairs, setChairs] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    fetchProcedureDetails()
  }, [procedureId])

  useEffect(() => {
    if (procedure?.assignment?.id) {
      fetchPhotos()
      fetchSessions()
    }
  }, [procedure?.assignment?.id])

  const fetchPhotos = async () => {
    if (!procedure?.assignment?.id) return
    
    try {
      setPhotosLoading(true)
      const response = await api.procedurePhotos.list(procedure.assignment.id)
      setPhotos(response.data.data || [])
    } catch (error: any) {
      console.error('Error loading photos:', error)
    } finally {
      setPhotosLoading(false)
    }
  }

  const isUserAssigned = () => {
    const studentId = procedure?.assignment?.student?.id
    const userId = user?.id
    return studentId != null && userId != null && studentId === userId
  }

  const canEditPhotos = () => {
    return isUserAssigned() && (procedure?.status === 'proceso' || procedure?.status === 'finalizado')
  }

  const pickAndUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir fotos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets[0].base64) {
      setUploadingPhoto(true)
      try {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`
        await api.procedurePhotos.uploadBase64(procedure.assignment.id, {
          image: base64Image,
        })
        Alert.alert('Éxito', 'Foto subida correctamente')
        fetchPhotos()
      } catch (error: any) {
        console.error('Error uploading photo:', error)
        Alert.alert('Error', error.response?.data?.message || 'No se pudo subir la foto')
      } finally {
        setUploadingPhoto(false)
      }
    }
  }

  const handleDeletePhoto = (photo: ProcedurePhoto) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro que deseas eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.procedurePhotos.delete(photo.id)
              setPhotos(photos.filter(p => p.id !== photo.id))
              setPhotoModalVisible(false)
              setSelectedPhoto(null)
              Alert.alert('Éxito', 'Foto eliminada correctamente')
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar la foto')
            }
          }
        }
      ]
    )
  }

  const handleUpdateDescription = async () => {
    if (!selectedPhoto) return
    
    try {
      await api.procedurePhotos.update(selectedPhoto.id, { description: newDescription })
      setPhotos(photos.map(p => 
        p.id === selectedPhoto.id ? { ...p, description: newDescription } : p
      ))
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

  const canEdit = () => {
    return procedure?.status === 'disponible' || procedure?.status === 'contraindicado'
  }

  const openEditModal = async () => {
    setEditChairId(procedure.chair?.id || null)
    setEditTreatmentId(procedure.treatment?.id || null)
    setEditSubclassId(procedure.treatment_subclass?.id || null)
    setEditOptionId(procedure.treatment_subclass_option?.id || null)
    setEditNotes(procedure.notes || '')
    try {
      const chairsRes = await api.chairs.list()
      setChairs(chairsRes.data.data || [])
      if (procedure.chair?.id) {
        const treatmentsRes = await api.treatments.list({ chair_id: procedure.chair.id })
        setTreatments(treatmentsRes.data.data || [])
      }
    } catch (e) {
      console.error('Error loading edit data:', e)
    }
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
    } catch (e) {
      console.error('Error loading treatments:', e)
    }
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

  const fetchSessions = async () => {
    if (!procedure?.assignment?.id) return
    try {
      setSessionsLoading(true)
      const response = await api.treatmentSessions.list(procedure.assignment.id)
      setSessions(response.data.data || [])
    } catch (error: any) {
      console.error('Error loading sessions:', error)
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleAddSession = async () => {
    if (!procedure?.assignment?.id) return
    setSavingSession(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await api.treatmentSessions.create(procedure.assignment.id, {
        session_date: today,
        notes: sessionNotes.trim() || undefined,
        status: 'completada',
      })
      Alert.alert('Éxito', 'Sesión registrada correctamente')
      setSessionNotes('')
      setShowAddSession(false)
      fetchSessions()
      fetchProcedureDetails()
    } catch (error: any) {
      console.error('Error creating session:', error)
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar la sesión')
    } finally {
      setSavingSession(false)
    }
  }

  const handleComplete = async () => {
    Alert.alert(
      'Completar Procedimiento',
      '¿Estás seguro que deseas marcar este procedimiento como finalizado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            try {
              setCompletingProcedure(true)
              await api.students.completeAssignment(procedure.assignment.id, {})
              Alert.alert('Éxito', 'Procedimiento completado')
              fetchProcedureDetails()
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo completar')
            } finally {
              setCompletingProcedure(false)
            }
          }
        }
      ]
    )
  }

  const fetchProcedureDetails = async () => {
    try {
      setLoading(true)
      const response = await api.procedures.get(procedureId)
      setProcedure(response.data.data)
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo cargar el procedimiento')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    Alert.alert(
      'Asignarme Procedimiento',
      '¿Estás seguro que deseas asignarte este procedimiento?',
      [
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
              Alert.alert('Error', error.response?.data?.message || 'No se pudo asignar el procedimiento')
            } finally {
              setActionLoading(false)
            }
          }
        }
      ]
    )
  }

  const isCreator = () => {
    return user?.id != null && procedure?.created_by?.id === user.id
  }

  const handleCancel = async () => {
    Alert.alert(
      'Cancelar Procedimiento',
      '¿Estás seguro que deseas cancelar este procedimiento? Esta acción no se puede deshacer.',
      [
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
              Alert.alert('Error', error.response?.data?.message || 'No se pudo cancelar el procedimiento')
            } finally {
              setActionLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleAbandon = async () => {
    Alert.prompt(
      'Abandonar Procedimiento',
      'Por favor indica el motivo del abandono:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Debes indicar un motivo')
              return
            }
            try {
              setActionLoading(true)
              await api.students.abandonAssignment(procedure.assignment.id, { reason: reason.trim() })
              Alert.alert('Éxito', 'Procedimiento abandonado')
              navigation.goBack()
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo abandonar el procedimiento')
            } finally {
              setActionLoading(false)
            }
          }
        }
      ],
      'plain-text'
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandTurquoise} />
          <AppText color="textMuted" style={styles.loadingText}>Cargando procedimiento...</AppText>
        </View>
      </View>
    )
  }

  if (!procedure) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <AppText color="error">No se pudo cargar el procedimiento</AppText>
        </View>
      </View>
    )
  }

  const isAssigned = procedure.status === 'proceso'
  const isAvailable = procedure.status === 'disponible'

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Ver Procedimiento
          </AppText>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AppText color="white" weight="semibold">Volver</AppText>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        {isAvailable && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.assignButton]}
              onPress={handleAssign}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color={colors.white} />
                  <AppText color="white" weight="semibold" style={styles.actionButtonText}>ASIGNARME</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isAssigned && isUserAssigned() && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.abandonButton]}
              onPress={handleAbandon}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="exit-outline" size={20} color={colors.white} />
                  <AppText color="white" weight="semibold" style={styles.actionButtonText}>ABANDONAR</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel button - only visible to creator, not for finalized/cancelled */}
        {isCreator() && procedure.status !== 'finalizado' && procedure.status !== 'cancelado' && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color={colors.white} />
                  <AppText color="white" weight="semibold" style={styles.actionButtonText}>CANCELAR PROCEDIMIENTO</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Estado label */}
        <View style={styles.statusBadgeContainer}>
          <View style={[
            styles.statusBadge,
            procedure.status === 'disponible' && styles.statusAvailable,
            procedure.status === 'proceso' && styles.statusInProgress,
            procedure.status === 'finalizado' && styles.statusCompleted,
            procedure.status === 'contraindicado' && styles.statusContraindicado,
            procedure.status === 'cancelado' && styles.statusCancelled,
          ]}>
            <Ionicons
              name={procedure.status === 'disponible' ? 'ellipse' : procedure.status === 'proceso' ? 'time' : procedure.status === 'finalizado' ? 'checkmark-circle' : procedure.status === 'cancelado' ? 'ban' : 'close-circle'}
              size={14}
              color="white"
              style={{ marginRight: 6 }}
            />
            <AppText color="white" weight="semibold" style={{ fontSize: 13 }}>
              {procedure.status === 'disponible' && 'Disponible'}
              {procedure.status === 'proceso' && 'En Proceso'}
              {procedure.status === 'finalizado' && 'Finalizado'}
              {procedure.status === 'contraindicado' && 'Contraindicado'}
              {procedure.status === 'cancelado' && 'Cancelado'}
            </AppText>
          </View>
        </View>

        {/* Patient info */}
        <View style={styles.patientSection}>
          <AppText color="brandNavy" weight="semibold" style={styles.sectionLabel}>
            Paciente
          </AppText>
          <View style={styles.patientCard}>
            <View style={styles.patientInfo}>
              <AppText variant="h3" color="brandNavy" weight="bold">{procedure.patient?.full_name || 'Paciente'}</AppText>
              <AppText color="textMuted" style={styles.patientMeta}>Edad: {procedure.patient?.age || 'N/A'} años</AppText>
              <AppText color="textMuted" style={styles.patientMeta}>Ciudad: {procedure.patient?.city || 'N/A'}</AppText>
              <AppText color="textMuted" style={styles.patientMeta}>
                Cédula: {procedure.patient?.document_number || 'N/A'}
              </AppText>
            </View>
            <TouchableOpacity 
              style={styles.viewFileButton}
              onPress={() => (navigation as any).navigate('PatientDetail', { patientId: procedure.patient?.id })}
            >
              <AppText color="white" weight="semibold" style={styles.viewFileButtonText}>
                Ver Ficha
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Procedure details */}
        <View style={styles.procedureSection}>
          <View style={styles.procedureHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="h3" color="brandNavy" weight="bold">
                {procedure.treatment?.name || 'Procedimiento'}
              </AppText>
              <AppText color="textMuted" style={styles.procedureMeta}>
                Cátedra: {procedure.chair?.name || 'N/A'}
              </AppText>
              {procedure.treatment_subclass && (
                <AppText color="textMuted" style={styles.procedureMeta}>
                  Sub-clase: {procedure.treatment_subclass.name}
                </AppText>
              )}
              {procedure.treatment_subclass_option && (
                <AppText color="textMuted" style={styles.procedureMeta}>
                  Sub-clase adicional: {procedure.treatment_subclass_option.name}
                </AppText>
              )}
            </View>
            {canEdit() && (
              <TouchableOpacity style={styles.editProcedureButton} onPress={openEditModal}>
                <Ionicons name="pencil" size={16} color={colors.brandNavy} />
                <AppText color="brandNavy" weight="semibold" style={{ marginLeft: 4, fontSize: 12 }}>Editar</AppText>
              </TouchableOpacity>
            )}
          </View>
          <AppText color="textMuted" style={styles.procedureDescription}>
            {procedure.description || 'Sin descripción disponible'}
          </AppText>
          {procedure.assignment?.student && (
            <View style={styles.assignedStudentInfo}>
              <AppText color="brandNavy" weight="semibold">Asignado a:</AppText>
              <AppText color="textMuted">{procedure.assignment.student.name}</AppText>
              {procedure.assignment.student.phone && (
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => {
                    const phone = procedure.assignment.student.phone.replace(/\D/g, '')
                    Linking.openURL(`https://wa.me/${phone}`)
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <AppText color="brandNavy" weight="semibold" style={{ marginLeft: 6, fontSize: 13 }}>
                    WhatsApp
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}
          {procedure.created_by && (
            <View style={styles.createdByInfo}>
              <AppText color="textMuted" style={{ fontSize: 12 }}>
                Creado por: {procedure.created_by.name}
              </AppText>
            </View>
          )}
        </View>

        {/* Sessions section */}
        {procedure.assignment && isUserAssigned() && (
          <View style={styles.sessionsSection}>
            <View style={styles.sessionsSectionHeader}>
              <AppText color="brandNavy" weight="semibold" style={styles.sectionLabel}>
                Sesiones ({sessions.length}{procedure.treatment?.estimated_sessions ? `/${procedure.treatment.estimated_sessions}` : ''})
              </AppText>
              {isAssigned && (
                <TouchableOpacity
                  style={styles.addSessionButton}
                  onPress={() => setShowAddSession(!showAddSession)}
                >
                  <Ionicons name={showAddSession ? 'close' : 'add-circle-outline'} size={18} color={colors.white} />
                  <AppText color="white" weight="semibold" style={{ marginLeft: 6, fontSize: 12 }}>
                    {showAddSession ? 'Cancelar' : 'Registrar Sesión'}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            {showAddSession && (
              <View style={styles.addSessionForm}>
                <TextInput
                  style={styles.sessionNotesInput}
                  value={sessionNotes}
                  onChangeText={setSessionNotes}
                  placeholder="Notas de la sesión (opcional)..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.saveSessionButton}
                  onPress={handleAddSession}
                  disabled={savingSession}
                >
                  {savingSession ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <AppText color="white" weight="semibold">Guardar Sesión</AppText>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {sessionsLoading ? (
              <View style={styles.photosLoadingContainer}>
                <ActivityIndicator size="small" color={colors.brandTurquoise} />
              </View>
            ) : sessions.length > 0 ? (
              <View style={styles.sessionsList}>
                {sessions.map((session) => (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionCardHeader}>
                      <View style={styles.sessionNumberBadge}>
                        <AppText color="white" weight="bold" style={{ fontSize: 12 }}>
                          #{session.session_number}
                        </AppText>
                      </View>
                      <AppText color="textMuted" style={{ fontSize: 13 }}>
                        {new Date(session.session_date).toLocaleDateString('es-PY')}
                      </AppText>
                      <View style={[
                        styles.sessionStatusBadge,
                        session.status === 'completada' && { backgroundColor: colors.success },
                        session.status === 'programada' && { backgroundColor: colors.warning },
                        session.status === 'cancelada' && { backgroundColor: colors.error },
                      ]}>
                        <AppText color="white" style={{ fontSize: 11 }}>
                          {session.status === 'completada' ? 'Completada' : session.status === 'programada' ? 'Programada' : 'Cancelada'}
                        </AppText>
                      </View>
                    </View>
                    {session.notes ? (
                      <AppText color="textMuted" style={{ fontSize: 13, marginTop: 4 }}>
                        {session.notes}
                      </AppText>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noPhotosContainer}>
                <Ionicons name="clipboard-outline" size={40} color={colors.textSecondary} />
                <AppText color="textMuted" style={styles.noPhotosText}>No hay sesiones registradas</AppText>
              </View>
            )}
          </View>
        )}

        {/* Completar Procedimiento */}
        {isAssigned && isUserAssigned() && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            disabled={completingProcedure}
          >
            {completingProcedure ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={colors.white} />
                <AppText color="white" weight="bold" style={{ marginLeft: 8, fontSize: 16 }}>
                  COMPLETAR PROCEDIMIENTO
                </AppText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Photos section */}
        <View style={styles.photosSection}>
          <View style={styles.photosSectionHeader}>
            <AppText color="brandNavy" weight="semibold" style={styles.sectionLabel}>
              Fotos del Procedimiento
            </AppText>
            {canEditPhotos() && (
              <TouchableOpacity 
                style={styles.addPhotoButton}
                onPress={pickAndUploadImage}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
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
                <TouchableOpacity 
                  key={photo.id} 
                  style={styles.photoThumbnail}
                  onPress={() => openPhotoModal(photo)}
                >
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

        {/* Photo Modal */}
        <Modal
          visible={photoModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setPhotoModalVisible(false)
                  setEditingDescription(false)
                }}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
              
              {selectedPhoto && (
                <>
                  <Image 
                    source={{ uri: selectedPhoto.url }} 
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  
                  <View style={styles.modalInfo}>
                    {editingDescription ? (
                      <View style={styles.editDescriptionContainer}>
                        <TextInput
                          style={styles.descriptionInput}
                          value={newDescription}
                          onChangeText={setNewDescription}
                          placeholder="Agregar descripción..."
                          placeholderTextColor={colors.textSecondary}
                          multiline
                        />
                        <View style={styles.editDescriptionButtons}>
                          <TouchableOpacity 
                            style={styles.cancelEditButton}
                            onPress={() => setEditingDescription(false)}
                          >
                            <AppText color="textMuted">Cancelar</AppText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.saveEditButton}
                            onPress={handleUpdateDescription}
                          >
                            <AppText color="white" weight="semibold">Guardar</AppText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        <AppText color="white" style={{ marginBottom: 8 }}>
                          {selectedPhoto.description || 'Sin descripción'}
                        </AppText>
                        <AppText color="textMuted" style={{ fontSize: 12 }}>
                          Subida por {selectedPhoto.created_by.name}
                        </AppText>
                        <AppText color="textMuted" style={{ fontSize: 12 }}>
                          {selectedPhoto.formatted_size}
                        </AppText>
                      </>
                    )}
                  </View>
                  
                  {canEditPhotos() && !editingDescription && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.modalActionButton}
                        onPress={() => setEditingDescription(true)}
                      >
                        <Ionicons name="pencil" size={20} color={colors.white} />
                        <AppText color="white" style={{ marginLeft: 8 }}>Editar</AppText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.deleteButton]}
                        onPress={() => handleDeletePhoto(selectedPhoto)}
                      >
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

        <View style={styles.spacer} />
      </ScrollView>

      {/* Edit Procedure Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
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
                      style={[
                        styles.editChip,
                        editChairId === chair.id && styles.editChipActive,
                      ]}
                      onPress={() => handleChairChange(chair.id)}
                    >
                      <AppText
                        color={editChairId === chair.id ? 'white' : 'brandNavy'}
                        style={{ fontSize: 13 }}
                      >
                        {chair.name}
                      </AppText>
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
                      style={[
                        styles.editTreatmentItem,
                        editTreatmentId === treatment.id && styles.editTreatmentItemActive,
                      ]}
                      onPress={() => { setEditTreatmentId(treatment.id); setEditSubclassId(null); }}
                    >
                      <AppText
                        color={editTreatmentId === treatment.id ? 'white' : 'brandNavy'}
                        weight={editTreatmentId === treatment.id ? 'bold' : 'normal'}
                        style={{ fontSize: 14 }}
                      >
                        {treatment.name}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <AppText color="textMuted" style={{ marginBottom: spacing.md, fontSize: 13 }}>
                  Selecciona una cátedra para ver tratamientos
                </AppText>
              )}

              {/* Subclass Selector */}
              {editTreatmentId && treatments.find((t: any) => t.id === editTreatmentId)?.subclasses?.length > 0 && (
                <>
                  <AppText color="brandNavy" weight="semibold" style={{ marginBottom: 8 }}>Sub-clase</AppText>
                  <View style={{ marginBottom: spacing.md }}>
                    {treatments.find((t: any) => t.id === editTreatmentId)?.subclasses?.map((sc: any) => (
                      <TouchableOpacity
                        key={sc.id}
                        style={[
                          styles.editTreatmentItem,
                          editSubclassId === sc.id && styles.editTreatmentItemActive,
                        ]}
                        onPress={() => { setEditSubclassId(editSubclassId === sc.id ? null : sc.id); setEditOptionId(null); }}
                      >
                        <AppText
                          color={editSubclassId === sc.id ? 'white' : 'brandNavy'}
                          weight={editSubclassId === sc.id ? 'bold' : 'normal'}
                          style={{ fontSize: 14 }}
                        >
                          {sc.name}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Subclass Option Selector */}
              {editSubclassId && (() => {
                const selectedTreatment = treatments.find((t: any) => t.id === editTreatmentId)
                const selectedSubclass = selectedTreatment?.subclasses?.find((s: any) => s.id === editSubclassId)
                const options = selectedSubclass?.options || []
                if (options.length === 0) return null
                return (
                  <>
                    <AppText color="brandNavy" weight="semibold" style={{ marginBottom: 8 }}>Sub-clase adicional</AppText>
                    <View style={{ marginBottom: spacing.md }}>
                      {options.map((opt: any) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.editTreatmentItem,
                            editOptionId === opt.id && styles.editTreatmentItemActive,
                          ]}
                          onPress={() => setEditOptionId(editOptionId === opt.id ? null : opt.id)}
                        >
                          <AppText
                            color={editOptionId === opt.id ? 'white' : 'brandNavy'}
                            weight={editOptionId === opt.id ? 'bold' : 'normal'}
                            style={{ fontSize: 14 }}
                          >
                            {opt.name}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )
              })()}

              <AppText color="brandNavy" weight="semibold" style={{ marginBottom: 8 }}>Notas</AppText>
              <TextInput
                style={styles.editNotesInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Notas del procedimiento..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <AppText color="brandNavy" weight="semibold">Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSaveButton}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <AppText color="white" weight="bold">Guardar</AppText>
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
  statusButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.brandNavy,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.brandTurquoise,
    borderColor: colors.brandTurquoise,
  },
  patientSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  patientCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
  },
  patientInfo: {
    marginBottom: spacing.md,
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
  },
  viewFileButtonText: {
    fontSize: 14,
  },
  procedureSection: {
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  procedureHeader: {
    marginBottom: spacing.sm,
  },
  procedureDescription: {
    lineHeight: 20,
  },
  photosSection: {
    marginBottom: spacing.lg,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoPlaceholder: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  spacer: {
    height: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  actionButtonsContainer: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  assignButton: {
    backgroundColor: colors.success,
  },
  abandonButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  statusCancelled: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    marginLeft: spacing.xs,
  },
  statusBadgeContainer: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusAvailable: {
    backgroundColor: colors.success,
  },
  statusInProgress: {
    backgroundColor: colors.warning,
  },
  statusCompleted: {
    backgroundColor: colors.brandTurquoise,
  },
  statusContraindicado: {
    backgroundColor: colors.error,
  },
  procedureMeta: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  assignedStudentInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  createdByInfo: {
    marginTop: spacing.sm,
  },
  noPhotosText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  photosLoadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  photoThumbnail: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  noPhotosContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  modalImage: {
    width: '100%',
    height: '60%',
    borderRadius: 8,
  },
  modalInfo: {
    width: '100%',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandNavy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  editDescriptionContainer: {
    width: '100%',
  },
  descriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  editDescriptionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelEditButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveEditButton: {
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  sessionsSection: {
    marginBottom: spacing.lg,
  },
  sessionsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  addSessionForm: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandTurquoise,
  },
  sessionNotesInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
    color: colors.brandNavy,
    fontSize: 14,
  },
  saveSessionButton: {
    backgroundColor: colors.brandTurquoise,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  sessionsList: {
    gap: spacing.sm,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.brandTurquoise,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionNumberBadge: {
    backgroundColor: colors.brandNavy,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sessionStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  editProcedureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4F8',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brandNavy,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editModalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  editChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brandNavy,
    backgroundColor: colors.white,
  },
  editChipActive: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  editTreatmentItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
    backgroundColor: colors.white,
  },
  editTreatmentItemActive: {
    backgroundColor: colors.brandTurquoise,
    borderColor: colors.brandTurquoise,
  },
  editNotesInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    color: colors.brandNavy,
    fontSize: 14,
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editCancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandNavy,
  },
  editSaveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.brandTurquoise,
  },
})
