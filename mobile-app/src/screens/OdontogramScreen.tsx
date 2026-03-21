import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, Modal, Pressable, TextInput } from 'react-native'
import { Text, Button, Surface, Chip, ActivityIndicator, FAB } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'
import AddProcedureModal from '../components/AddProcedureModal'

interface PatientProcedure {
  id: number
  treatment: {
    id: number
    name: string
    code: string
  }
  chair: {
    id: number
    name: string
  }
  treatment_subclass?: {
    id: number
    name: string
  } | null
  treatment_subclass_option?: {
    id: number
    name: string
  } | null
  tooth_fdi: string | null
  tooth_surface: string | null
  status: 'disponible' | 'proceso' | 'finalizado' | 'contraindicado' | 'ausente' | 'cancelado'
  notes: string | null
  priority: string
}

interface Chair {
  id: number
  name: string
  color: string
}

const TOOTH_NUMBERS_UPPER = [
  [18, 17, 16, 15, 14, 13, 12, 11],
  [21, 22, 23, 24, 25, 26, 27, 28],
]

const TOOTH_NUMBERS_LOWER = [
  [48, 47, 46, 45, 44, 43, 42, 41],
  [31, 32, 33, 34, 35, 36, 37, 38],
]

const PEDIATRIC_TOOTH_NUMBERS_UPPER = [
  [55, 54, 53, 52, 51],
  [61, 62, 63, 64, 65],
]

const PEDIATRIC_TOOTH_NUMBERS_LOWER = [
  [85, 84, 83, 82, 81],
  [71, 72, 73, 74, 75],
]

const PROCEDURE_STATUS_COLORS = {
  disponible: '#FEE2E2',
  proceso: '#FEF3C7',
  finalizado: '#DBEAFE',
  contraindicado: '#F3E8FF',
  ausente: '#D1D5DB',
  cancelado: '#E5E7EB',
}

const PROCEDURE_STATUS_BORDER_COLORS = {
  disponible: '#EF4444',
  proceso: '#F59E0B',
  finalizado: '#3B82F6',
  contraindicado: '#9333EA',
  ausente: '#6B7280',
  cancelado: '#9CA3AF',
}

const PROCEDURE_STATUS_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  proceso: 'En Proceso',
  finalizado: 'Finalizado',
  contraindicado: 'Contraindicado',
  ausente: 'Ausente',
  cancelado: 'Cancelado',
}

const LEGEND_STATUSES = ['disponible', 'proceso', 'finalizado', 'ausente']

export default function OdontogramScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const params = route.params as { patientId: number; isPediatric?: boolean } | undefined

  const { user } = useAuthStore()
  const [procedures, setProcedures] = useState<PatientProcedure[]>([])
  const [chairs, setChairs] = useState<Chair[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeeth, setSelectedTeeth] = useState<Set<string>>(new Set())
  const [modalVisible, setModalVisible] = useState(false)
  const [prosthesisLoading, setProsthesisLoading] = useState(false)

  // Photo gallery state
  const [odontoPhotos, setOdontoPhotos] = useState<any[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [photoModalVisible, setPhotoModalVisible] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    if (params?.patientId) {
      loadProcedures()
      loadChairs()
      loadOdontoPhotos()
    } else {
      setLoading(false)
    }
  }, [params?.patientId])

  const loadProcedures = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/patients/${params?.patientId}/procedures`)
      const rawData = response.data
      const data = Array.isArray(rawData) ? rawData : (rawData?.data || [])
      console.log('[Odontogram] Loaded', data.length, 'procedures, with tooth_fdi:', data.filter((p: any) => p.tooth_fdi).length)
      setProcedures(data)
    } catch (error: any) {
      console.error('[Odontogram] Error loading procedures:', error?.message, error?.response?.status)
      Alert.alert('Error', 'No se pudieron cargar los procedimientos del paciente')
    } finally {
      setLoading(false)
    }
  }

  const loadChairs = async () => {
    try {
      const response = await api.get('/chairs')
      setChairs(response.data.data)
    } catch (error) {
      console.error('Error loading chairs:', error)
    }
  }

  const loadOdontoPhotos = async () => {
    if (!params?.patientId) return
    try {
      setPhotosLoading(true)
      const response = await api.odontogramPhotos.list(params.patientId)
      setOdontoPhotos(response.data.data || [])
    } catch (error) {
      console.error('Error loading odontogram photos:', error)
    } finally {
      setPhotosLoading(false)
    }
  }

  const showPhotoOptions = () => {
    Alert.alert('Agregar Foto', 'Selecciona una opción', [
      { text: 'Cámara', onPress: () => captureOdontoPhoto('camera') },
      { text: 'Galería', onPress: () => captureOdontoPhoto('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  const captureOdontoPhoto = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara')
        return
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería')
        return
      }
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
      let uploaded = 0
      let failed = 0
      try {
        for (const asset of validAssets) {
          try {
            const base64Image = `data:image/jpeg;base64,${asset.base64}`
            await api.odontogramPhotos.uploadBase64(params?.patientId || 0, { image: base64Image })
            uploaded++
          } catch {
            failed++
          }
        }
        if (failed > 0) {
          Alert.alert('Resultado', `${uploaded} foto(s) subida(s), ${failed} fallida(s)`)
        } else {
          Alert.alert('Éxito', uploaded === 1 ? 'Foto subida correctamente' : `${uploaded} fotos subidas correctamente`)
        }
        loadOdontoPhotos()
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'No se pudieron subir las fotos')
      } finally {
        setUploadingPhoto(false)
      }
    }
  }

  const handleDeleteOdontoPhoto = (photo: any) => {
    Alert.alert('Eliminar Foto', '¿Estás seguro que deseas eliminar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.odontogramPhotos.delete(photo.id)
            setOdontoPhotos(prev => prev.filter(p => p.id !== photo.id))
            setPhotoModalVisible(false)
            setSelectedPhoto(null)
            Alert.alert('Éxito', 'Foto eliminada correctamente')
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar la foto')
          }
        },
      },
    ])
  }

  const handleUpdateOdontoDescription = async () => {
    if (!selectedPhoto) return
    try {
      await api.odontogramPhotos.update(selectedPhoto.id, { description: newDescription })
      setOdontoPhotos(prev => prev.map(p => p.id === selectedPhoto.id ? { ...p, description: newDescription } : p))
      setSelectedPhoto({ ...selectedPhoto, description: newDescription })
      setEditingDescription(false)
      Alert.alert('Éxito', 'Descripción actualizada')
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar')
    }
  }

  const openOdontoPhotoModal = (photo: any) => {
    setSelectedPhoto(photo)
    setNewDescription(photo.description || '')
    setPhotoModalVisible(true)
    setEditingDescription(false)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const proceduresByTooth = procedures.reduce((acc, procedure) => {
    if (procedure.tooth_fdi) {
      const teeth = procedure.tooth_fdi.split(',').map((t: string) => t.trim())
      for (const tooth of teeth) {
        if (!acc[tooth]) {
          acc[tooth] = []
        }
        acc[tooth].push(procedure)
      }
    }
    return acc
  }, {} as Record<string, PatientProcedure[]>)

  const getToothStatus = (toothFdi: string): keyof typeof PROCEDURE_STATUS_COLORS | null => {
    const toothProcedures = proceduresByTooth[toothFdi]
    if (!toothProcedures || toothProcedures.length === 0) return null

    if (toothProcedures.some(p => p.status === 'ausente')) return 'ausente'
    if (toothProcedures.some(p => p.status === 'proceso')) return 'proceso'
    if (toothProcedures.some(p => p.status === 'disponible')) return 'disponible'
    if (toothProcedures.some(p => p.status === 'finalizado')) return 'finalizado'
    
    return null
  }

  const handleToothPress = (toothNumber: number) => {
    const toothFdi = toothNumber.toString()
    setSelectedTeeth(prev => {
      const next = new Set(prev)
      if (next.has(toothFdi)) {
        next.delete(toothFdi)
      } else {
        next.add(toothFdi)
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedTeeth(new Set())
  }

  // Prosthesis treatment IDs (from DB)
  const PROSTHESIS_TREATMENTS = {
    upper: { id: 46, name: 'Completa Superior' },
    lower: { id: 47, name: 'Completa Inferior' },
  }
  const PROSTHESIS_CHAIR_ID = 6

  const getActiveProsthesis = (type: 'upper' | 'lower'): PatientProcedure | undefined => {
    const treatment = PROSTHESIS_TREATMENTS[type]
    return procedures.find(p =>
      p.treatment?.id === treatment.id &&
      p.status !== 'finalizado' && p.status !== 'cancelado'
    )
  }

  const getTeethForProsthesis = (type: 'upper' | 'lower'): string[] => {
    const upper = TOOTH_NUMBERS_UPPER.flat().map(String)
    const lower = TOOTH_NUMBERS_LOWER.flat().map(String)
    if (type === 'upper') return upper
    return lower
  }

  const handleProsthesis = (type: 'upper' | 'lower') => {
    const activeProsthesis = getActiveProsthesis(type)
    const treatment = PROSTHESIS_TREATMENTS[type]
    
    if (activeProsthesis) {
      // Deactivate: cancel the existing prosthesis
      Alert.alert(
        'Desactivar Prótesis',
        `¿Estás seguro que deseas cancelar la prótesis "${treatment.name}"? Esta acción cancelará el procedimiento asociado.`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: () => cancelProsthesisProcedure(activeProsthesis.id),
          },
        ]
      )
    } else {
      // Create new prosthesis
      const teeth = getTeethForProsthesis(type)
      Alert.alert(
        'Crear Prótesis',
        `Esta acción creará un procedimiento de prótesis "${treatment.name}".\n\n¿Quiere continuar?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí',
            onPress: () => createProsthesisProcedure(type),
          },
        ]
      )
    }
  }

  const createProsthesisProcedure = async (type: 'upper' | 'lower') => {
    const treatment = PROSTHESIS_TREATMENTS[type]
    const teeth = getTeethForProsthesis(type)
    setProsthesisLoading(true)
    try {
      await api.procedures.createForPatient(params?.patientId || 0, {
        treatment_id: treatment.id,
        chair_id: PROSTHESIS_CHAIR_ID,
        tooth_fdi: teeth.join(','),
        status: 'disponible',
        notes: `Prótesis ${treatment.name} - ${teeth.length} dientes`,
      })
      Alert.alert('Éxito', `Prótesis "${treatment.name}" creada correctamente`)
      loadProcedures()
    } catch (error: any) {
      console.error('Error creating prosthesis:', error)
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la prótesis')
    } finally {
      setProsthesisLoading(false)
    }
  }

  const cancelProsthesisProcedure = async (procedureId: number) => {
    setProsthesisLoading(true)
    try {
      await api.procedures.cancel(procedureId)
      Alert.alert('Éxito', 'Prótesis cancelada correctamente')
      loadProcedures()
    } catch (error: any) {
      console.error('Error cancelling prosthesis:', error)
      Alert.alert('Error', error.response?.data?.message || 'No se pudo cancelar la prótesis')
    } finally {
      setProsthesisLoading(false)
    }
  }

  const handleAddProcedure = () => {
    if (selectedTeeth.size === 0) {
      Alert.alert('Seleccionar dientes', 'Debes seleccionar al menos un diente en el odontograma antes de agregar un procedimiento.')
      return
    }
    setModalVisible(true)
  }

  const handleModalSuccess = () => {
    loadProcedures()
    setModalVisible(false)
    setSelectedTeeth(new Set())
  }

  const renderTooth = (toothNumber: number) => {
    const toothFdi = toothNumber.toString()
    const status = getToothStatus(toothFdi)
    const isSelected = selectedTeeth.has(toothFdi)
    const toothProcedures = proceduresByTooth[toothFdi] || []
    const procedureCount = toothProcedures.length

    return (
      <TouchableOpacity
        key={toothNumber}
        style={[
          styles.tooth,
          {
            backgroundColor: status ? PROCEDURE_STATUS_COLORS[status] : '#FFFFFF',
            borderColor: status ? PROCEDURE_STATUS_BORDER_COLORS[status] : '#E0E0E0',
          },
          isSelected && styles.toothSelected,
        ]}
        onPress={() => handleToothPress(toothNumber)}
      >
        <Text style={[styles.toothNumber, { color: status === 'ausente' ? '#9CA3AF' : status ? '#1F2937' : '#666', textDecorationLine: status === 'ausente' ? 'line-through' : 'none' }]}>
          {toothNumber}
        </Text>
        {procedureCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{procedureCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando odontograma...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={24} color="#1B2B5A" />
          </TouchableOpacity>
          <Text style={styles.title}>Odontograma</Text>
        </View>

        <Surface style={styles.infoCard}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Odontograma basado en procedimientos:</Text> Los colores indican el estado de los procedimientos asignados a cada diente. Toca un diente para ver sus procedimientos.
          </Text>
        </Surface>

        {/* Arcada Superior Adulto */}
        <Surface style={styles.arcadeContainer}>
          <Text style={styles.arcadeTitle}>Arcada Superior Adulto</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.arcadeScrollContent}
            nestedScrollEnabled={true}
          >
            <View style={styles.arcade}>
              <View style={styles.quadrant}>
                {TOOTH_NUMBERS_UPPER[0].map(renderTooth)}
              </View>
              <View style={styles.quadrant}>
                {TOOTH_NUMBERS_UPPER[1].map(renderTooth)}
              </View>
            </View>
          </ScrollView>
        </Surface>

        {/* Arcada Superior Pediátrica */}
        <Surface style={styles.arcadeContainer}>
          <Text style={styles.arcadeTitle}>Arcada Superior Pediátrica</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.arcadeScrollContent}
            nestedScrollEnabled={true}
          >
            <View style={[styles.arcade, { justifyContent: 'center' }]}>
              <View style={styles.quadrant}>
                {PEDIATRIC_TOOTH_NUMBERS_UPPER[0].map(renderTooth)}
              </View>
              <View style={styles.quadrant}>
                {PEDIATRIC_TOOTH_NUMBERS_UPPER[1].map(renderTooth)}
              </View>
            </View>
          </ScrollView>
        </Surface>

        {/* Arcada Inferior Pediátrica */}
        <Surface style={styles.arcadeContainer}>
          <Text style={styles.arcadeTitle}>Arcada Inferior Pediátrica</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.arcadeScrollContent}
            nestedScrollEnabled={true}
          >
            <View style={[styles.arcade, { justifyContent: 'center' }]}>
              <View style={styles.quadrant}>
                {PEDIATRIC_TOOTH_NUMBERS_LOWER[0].map(renderTooth)}
              </View>
              <View style={styles.quadrant}>
                {PEDIATRIC_TOOTH_NUMBERS_LOWER[1].map(renderTooth)}
              </View>
            </View>
          </ScrollView>
        </Surface>

        {/* Arcada Inferior Adulto */}
        <Surface style={styles.arcadeContainer}>
          <Text style={styles.arcadeTitle}>Arcada Inferior Adulto</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.arcadeScrollContent}
            nestedScrollEnabled={true}
          >
            <View style={styles.arcade}>
              <View style={styles.quadrant}>
                {TOOTH_NUMBERS_LOWER[0].map(renderTooth)}
              </View>
              <View style={styles.quadrant}>
                {TOOTH_NUMBERS_LOWER[1].map(renderTooth)}
              </View>
            </View>
          </ScrollView>
        </Surface>

        {/* Prótesis selector */}
        <Surface style={styles.quickSelectContainer}>
          <Text style={styles.quickSelectTitle}>Prótesis</Text>
          <View style={styles.quickSelectRow}>
            <Button mode={getActiveProsthesis('upper') ? 'contained' : 'outlined'} onPress={() => handleProsthesis('upper')} compact style={styles.quickSelectButton} labelStyle={styles.quickSelectLabel} disabled={prosthesisLoading}>Completo Superior</Button>
            <Button mode={getActiveProsthesis('lower') ? 'contained' : 'outlined'} onPress={() => handleProsthesis('lower')} compact style={styles.quickSelectButton} labelStyle={styles.quickSelectLabel} disabled={prosthesisLoading}>Completo Inferior</Button>
          </View>
          {prosthesisLoading && (
            <View style={styles.selectedTeethInfo}>
              <ActivityIndicator size="small" />
              <Text style={styles.selectedTeethInfoText}>Creando prótesis...</Text>
            </View>
          )}
        </Surface>

        {/* Detalles del diente seleccionado (solo si hay 1) */}
        {selectedTeeth.size === 1 && (() => {
          const singleTooth = Array.from(selectedTeeth)[0]
          return (
          <Surface style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Diente {singleTooth}</Text>
            
            {proceduresByTooth[singleTooth] && proceduresByTooth[singleTooth].length > 0 ? (
              <View style={styles.proceduresList}>
                {proceduresByTooth[singleTooth].map((procedure) => (
                  <TouchableOpacity
                    key={procedure.id}
                    activeOpacity={0.7}
                    onPress={() => (navigation as any).navigate('AssignmentDetail', { procedureId: procedure.id })}
                  >
                    <Surface style={[
                      styles.procedureCard,
                      { borderLeftColor: PROCEDURE_STATUS_BORDER_COLORS[procedure.status] }
                    ]}>
                      <View style={styles.procedureHeader}>
                        <Text style={styles.procedureName}>{procedure.treatment.name}</Text>
                        <Chip
                          style={[
                            styles.statusChip,
                            { backgroundColor: PROCEDURE_STATUS_COLORS[procedure.status] }
                          ]}
                          textStyle={styles.statusChipText}
                        >
                          {PROCEDURE_STATUS_LABELS[procedure.status]}
                        </Chip>
                      </View>
                      <Text style={styles.procedureCode}>Código: {procedure.treatment.code}</Text>
                      <Text style={styles.procedureChair}>Cátedra: {procedure.chair.name}</Text>
                      {procedure.treatment_subclass && (
                        <Text style={styles.procedureChair}>Sub-clase: {procedure.treatment_subclass.name}</Text>
                      )}
                      {procedure.treatment_subclass_option && (
                        <Text style={styles.procedureChair}>Sub-clase adicional: {procedure.treatment_subclass_option.name}</Text>
                      )}
                      {procedure.tooth_surface && (
                        <Text style={styles.procedureSurface}>Superficie: {procedure.tooth_surface}</Text>
                      )}
                      {procedure.notes && (
                        <Text style={styles.procedureNotes}>Notas: {procedure.notes}</Text>
                      )}
                    </Surface>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay procedimientos asignados a este diente</Text>
              </View>
            )}
          </Surface>
          )
        })()}

        {/* Leyenda */}
        <Surface style={styles.legend}>
          <Text style={styles.legendTitle}>Leyenda de Estados:</Text>
          <View style={styles.legendItems}>
            {LEGEND_STATUSES.map((status) => (
              <View key={status} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    {
                      backgroundColor: PROCEDURE_STATUS_COLORS[status as keyof typeof PROCEDURE_STATUS_COLORS],
                      borderColor: PROCEDURE_STATUS_BORDER_COLORS[status as keyof typeof PROCEDURE_STATUS_BORDER_COLORS],
                    },
                  ]}
                />
                <Text style={styles.legendLabel}>{PROCEDURE_STATUS_LABELS[status]}</Text>
              </View>
            ))}
          </View>
        </Surface>

        {/* Galería de Fotos del Odontograma */}
        <Surface style={styles.photoGallerySection}>
          <View style={styles.photoGalleryHeader}>
            <Text style={styles.photoGalleryTitle}>Galería de Fotos</Text>
            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={showPhotoOptions}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="camera" size={16} color="#fff" />
                  <Text style={styles.addPhotoBtnText}>Agregar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {photosLoading ? (
            <View style={styles.photosLoadingBox}>
              <ActivityIndicator size="small" color="#2196F3" />
            </View>
          ) : odontoPhotos.length > 0 ? (
            <View style={styles.photosGrid}>
              {odontoPhotos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoThumb}
                  onPress={() => openOdontoPhotoModal(photo)}
                >
                  <Image source={{ uri: photo.url }} style={styles.photoThumbImage} />
                  <View style={styles.photoDateOverlay}>
                    <Text style={styles.photoDateText}>{formatDate(photo.taken_at)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPhotos}>
              <Ionicons name="images-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyPhotosText}>No hay fotos del odontograma</Text>
              <Text style={styles.emptyPhotosSubtext}>Toca "Agregar" para subir fotos de la dentadura</Text>
            </View>
          )}
        </Surface>

        <View style={styles.spacerBottom} />
      </ScrollView>

      {/* Modal de foto del odontograma */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPhotoModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            {selectedPhoto && (
              <>
                <Image source={{ uri: selectedPhoto.url }} style={styles.modalImage} resizeMode="contain" />
                <View style={styles.modalInfo}>
                  <Text style={styles.modalDate}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" /> {formatDate(selectedPhoto.taken_at)}
                  </Text>
                  {selectedPhoto.created_by && (
                    <Text style={styles.modalAuthor}>
                      <Ionicons name="person-outline" size={14} color="#6B7280" /> {selectedPhoto.created_by.name}
                    </Text>
                  )}

                  {editingDescription ? (
                    <View style={styles.descriptionEditBox}>
                      <TextInput
                        style={styles.descriptionInput}
                        value={newDescription}
                        onChangeText={setNewDescription}
                        placeholder="Descripción de la foto..."
                        multiline
                      />
                      <View style={styles.descriptionActions}>
                        <TouchableOpacity onPress={() => setEditingDescription(false)} style={styles.descCancelBtn}>
                          <Text style={styles.descCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleUpdateOdontoDescription} style={styles.descSaveBtn}>
                          <Text style={styles.descSaveText}>Guardar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedPhoto.created_by?.id === user?.id) {
                          setEditingDescription(true)
                        }
                      }}
                    >
                      <Text style={styles.modalDescription}>
                        {selectedPhoto.description || 'Sin descripción'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.modalButtons}>
                  {selectedPhoto.created_by?.id === user?.id && (
                    <>
                      <TouchableOpacity
                        style={styles.modalEditBtn}
                        onPress={() => setEditingDescription(true)}
                      >
                        <Ionicons name="pencil" size={18} color="#3B82F6" />
                        <Text style={styles.modalEditText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalDeleteBtn}
                        onPress={() => handleDeleteOdontoPhoto(selectedPhoto)}
                      >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                        <Text style={styles.modalDeleteText}>Eliminar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setPhotoModalVisible(false)}
                  >
                    <Text style={styles.modalCloseText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* FAB para agregar procedimiento */}
      <FAB
        icon="plus"
        style={[styles.fab, selectedTeeth.size === 0 && styles.fabDisabled]}
        onPress={handleAddProcedure}
        label={selectedTeeth.size > 0 ? `Procedimiento (${selectedTeeth.size} dientes)` : 'Seleccionar dientes'}
      />

      {/* Modal para agregar procedimiento */}
      <AddProcedureModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        patientId={params?.patientId || 0}
        selectedTeeth={Array.from(selectedTeeth)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    gap: 12,
  },
  backArrow: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  spacerBottom: {
    height: 24,
  },
  infoCard: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    elevation: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: 'bold',
  },
  arcadeContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  arcadeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  arcade: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  arcadeScrollContent: {
    paddingHorizontal: 8,
  },
  quadrant: {
    flexDirection: 'row',
    gap: 4,
  },
  tooth: {
    width: 40,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  toothSelected: {
    borderColor: '#000',
    borderWidth: 3,
  },
  toothNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  absentMark: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    opacity: 0.6,
  },
  detailsContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  proceduresList: {
    gap: 12,
  },
  procedureCard: {
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    borderLeftWidth: 4,
  },
  procedureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  procedureName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 11,
    color: '#1F2937',
  },
  procedureCode: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  procedureChair: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  procedureSurface: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  procedureNotes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  legend: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#FAFAFA',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 2,
  },
  legendLabel: {
    fontSize: 13,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#2196F3',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
  },
  fabDisabled: {
    backgroundColor: '#9CA3AF',
  },
  quickSelectContainer: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  quickSelectTitle: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  quickSelectRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    alignItems: 'center' as const,
  },
  quickSelectButton: {
    borderColor: '#3B82F6',
  },
  quickSelectLabel: {
    fontSize: 12,
  },
  quickSelectClearLabel: {
    fontSize: 12,
    color: '#EF4444',
  },
  selectedTeethRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 4,
    marginTop: 10,
  },
  selectedToothChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  selectedToothChipText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#1D4ED8',
  },
  selectedTeethInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedTeethInfoText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#374151',
  },
  // Photo gallery styles
  photoGallerySection: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  photoGalleryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  photoGalleryTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#1F2937',
  },
  addPhotoBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addPhotoBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  photosLoadingBox: {
    padding: 24,
    alignItems: 'center' as const,
  },
  photosGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoThumbImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  photoDateOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  photoDateText: {
    color: '#fff',
    fontSize: 9,
    textAlign: 'center' as const,
  },
  emptyPhotos: {
    padding: 24,
    alignItems: 'center' as const,
    gap: 8,
  },
  emptyPhotosText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyPhotosSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center' as const,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%' as const,
    maxHeight: '90%' as const,
    overflow: 'hidden' as const,
  },
  modalImage: {
    width: '100%' as const,
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  modalInfo: {
    padding: 16,
    gap: 6,
  },
  modalDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalAuthor: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalDescription: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  descriptionEditBox: {
    marginTop: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top' as const,
  },
  descriptionActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 12,
    marginTop: 8,
  },
  descCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  descCancelText: {
    color: '#6B7280',
    fontSize: 14,
  },
  descSaveBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  descSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
  },
  modalEditBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  modalEditText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  modalDeleteBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  modalDeleteText: {
    color: '#EF4444',
    fontSize: 14,
  },
  modalCloseBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalCloseText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500' as const,
  },
})
