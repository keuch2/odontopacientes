import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { AppText } from './ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface Photo {
  id: number
  file_path: string
  file_name: string
  description?: string
  taken_at: string
  url?: string
}

interface PhotoGalleryProps {
  assignmentId: number
  photos: Photo[]
  onPhotosChange?: () => void
  editable?: boolean
}

export function PhotoGallery({ assignmentId, photos, onPhotosChange, editable = false }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [uploading, setUploading] = useState(false)

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Se necesitan permisos para acceder a la galería de fotos')
      return false
    }
    return true
  }

  const handleAddPhoto = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen')
    }
  }

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Se necesitan permisos para usar la cámara')
      return
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto')
    }
  }

  const uploadPhoto = async (uri: string) => {
    try {
      setUploading(true)
      
      const formData = new FormData()
      const filename = uri.split('/').pop() || 'photo.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      formData.append('photo', {
        uri,
        name: filename,
        type,
      } as any)

      await api.photos.upload(assignmentId, formData)

      Alert.alert('Éxito', 'Foto subida correctamente')
      onPhotosChange?.()
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo subir la foto')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = (photoId: number) => {
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
              await api.photos.delete(assignmentId, photoId)
              Alert.alert('Éxito', 'Foto eliminada')
              setSelectedPhoto(null)
              onPhotosChange?.()
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar la foto')
            }
          }
        }
      ]
    )
  }

  const showPhotoOptions = () => {
    Alert.alert(
      'Agregar Foto',
      'Selecciona una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: handleTakePhoto },
        { text: 'Seleccionar de Galería', onPress: handleAddPhoto },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText color="brandNavy" weight="semibold" style={styles.title}>
          Fotos del Procedimiento
        </AppText>
        {editable && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={showPhotoOptions}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="camera" size={20} color={colors.white} />
                <AppText color="white" weight="semibold" style={styles.addButtonText}>
                  Agregar
                </AppText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={48} color={colors.textMuted} />
          <AppText color="textMuted" style={styles.emptyText}>
            No hay fotos disponibles
          </AppText>
          {editable && (
            <AppText color="textMuted" style={styles.emptySubtext}>
              Toca "Agregar" para subir fotos
            </AppText>
          )}
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          <View style={styles.photosGrid}>
            {photos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoItem}
                onPress={() => setSelectedPhoto(photo)}
              >
                <Image
                  source={{ uri: photo.url || photo.file_path }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <View style={styles.photoOverlay}>
                  <Ionicons name="expand" size={24} color={colors.white} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Modal para ver foto en grande */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedPhoto(null)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <AppText color="white" weight="semibold" style={styles.modalTitle}>
                  {selectedPhoto?.file_name || 'Foto'}
                </AppText>
                <View style={styles.modalActions}>
                  {editable && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => selectedPhoto && handleDeletePhoto(selectedPhoto.id)}
                    >
                      <Ionicons name="trash-outline" size={24} color={colors.white} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setSelectedPhoto(null)}
                  >
                    <Ionicons name="close" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {selectedPhoto && (
                <Image
                  source={{ uri: selectedPhoto.url || selectedPhoto.file_path }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}

              {selectedPhoto?.description && (
                <View style={styles.modalDescription}>
                  <AppText color="white" style={styles.descriptionText}>
                    {selectedPhoto.description}
                  </AppText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: '#E0E0E0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.brandTurquoise,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
  photosScroll: {
    marginHorizontal: -spacing.lg,
  },
  photosGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  photoItem: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  modalTitle: {
    fontSize: 16,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    padding: spacing.sm,
  },
  modalImage: {
    flex: 1,
    width: '100%',
  },
  modalDescription: {
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
})
