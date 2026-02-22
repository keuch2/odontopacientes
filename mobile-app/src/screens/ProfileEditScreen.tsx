import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, FlatList } from 'react-native'
import { TextInput, Button, SegmentedButtons } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { useAuthStore } from '../store/auth'
import { api } from '../lib/api'
import { getStorageUrl } from '../lib/storage'

type PlanType = 'gratuito' | 'premium'

export default function ProfileEditScreen() {
  const navigation = useNavigation()
  const { user, setUser } = useAuthStore()

  const [fullName, setFullName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState((user as any)?.phone || '')
  const [age, setAge] = useState((user as any)?.birth_date || '')
  const [city, setCity] = useState((user as any)?.city || '')
  const [institution, setInstitution] = useState((user as any)?.institution || user?.faculty?.name || '')
  const [universityId, setUniversityId] = useState<number | null>((user as any)?.university_id || null)
  const [universities, setUniversities] = useState<{id: number; name: string}[]>([])
  const [showUniversityPicker, setShowUniversityPicker] = useState(false)
  const [course, setCourse] = useState((user as any)?.course || '')
  const [plan, setPlan] = useState<PlanType>('gratuito')
  const [facebook, setFacebook] = useState((user as any)?.facebook || '')
  const [instagram, setInstagram] = useState((user as any)?.instagram || '')
  const [tiktok, setTiktok] = useState((user as any)?.tiktok || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>((user as any)?.profile_image || null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadUniversities()
  }, [])

  const loadUniversities = async () => {
    try {
      const response = await api.universities.list()
      setUniversities(response.data.data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto de perfil')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (!result.canceled && result.assets[0].base64) {
      setUploadingImage(true)
      try {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`
        const response = await api.users.uploadProfileImage(base64Image)
        
        if (response.data.data.profile_image) {
          setProfileImage(response.data.data.profile_image)
          if (user) {
            setUser({ ...user, profile_image: response.data.data.profile_image } as any)
          }
          Alert.alert('Éxito', 'Imagen de perfil actualizada')
        }
      } catch (error: any) {
        console.error('Error uploading image:', error)
        Alert.alert('Error', 'No se pudo subir la imagen')
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'El nombre es requerido')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden')
      return
    }

    if (newPassword && newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      if (user?.id) {
        const response = await api.users.updateProfile({
          name: fullName,
          phone: phone || undefined,
          city: city || undefined,
          institution: institution || undefined,
          university_id: universityId || undefined,
          course: course || undefined,
          facebook: facebook || undefined,
          instagram: instagram || undefined,
          tiktok: tiktok || undefined,
        })

        if (response.data.data) {
          setUser({ ...user, ...response.data.data })
        }

        if (newPassword) {
          await api.users.changePassword({
            password: newPassword,
            password_confirmation: confirmPassword,
          })
        }

        Alert.alert('Éxito', 'Perfil actualizado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ])
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const renderSection = (title: string, icon: keyof typeof Ionicons.glyphMap, children: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.brandTurquoise} />
        <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginLeft: spacing.sm }}>
          {title}
        </AppText>
      </View>
      {children}
    </View>
  )

  const getProfileImageUrl = () => getStorageUrl(profileImage)

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.brandNavy} />
        </TouchableOpacity>
        <AppText variant="h2" color="brandNavy" weight="bold">
          Mi Perfil
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
>
        <View style={styles.profileImageSection}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer} disabled={uploadingImage}>
            {profileImage ? (
              <Image source={{ uri: getProfileImageUrl() || '' }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={60} color={colors.textSecondary} />
              </View>
            )}
            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={colors.brandTurquoise} />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <AppText variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.sm }}>
            Toca para cambiar tu foto de perfil
          </AppText>
        </View>
        {renderSection('Información Personal', 'person-outline', (
          <>
            <TextInput
              label="Nombre Completo"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            <TextInput
              label="Email (Usuario)"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
              disabled
            />
            <TextInput
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
            />
            <TextInput
              label="Edad"
              value={age}
              onChangeText={setAge}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              left={<TextInput.Icon icon="calendar" />}
            />
            <TextInput
              label="Ciudad"
              value={city}
              onChangeText={setCity}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" />}
            />
          </>
        ))}

        {renderSection('Información Académica', 'school-outline', (
          <>
            <TouchableOpacity
              onPress={() => setShowUniversityPicker(!showUniversityPicker)}
              style={styles.pickerButton}
            >
              <Ionicons name="school-outline" size={20} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" color="textSecondary">Universidad</AppText>
                <AppText variant="body" color={universityId ? 'brandNavy' : 'textMuted'}>
                  {universityId ? universities.find(u => u.id === universityId)?.name || 'Seleccionar...' : 'Seleccionar universidad...'}
                </AppText>
              </View>
              <Ionicons name={showUniversityPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {showUniversityPicker && (
              <View style={styles.pickerList}>
                <TouchableOpacity
                  style={[styles.pickerItem, !universityId && styles.pickerItemSelected]}
                  onPress={() => { setUniversityId(null); setShowUniversityPicker(false); }}
                >
                  <AppText variant="body" color={!universityId ? 'brandTurquoise' : 'textSecondary'}>Sin universidad</AppText>
                </TouchableOpacity>
                {universities.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.pickerItem, universityId === u.id && styles.pickerItemSelected]}
                    onPress={() => { setUniversityId(u.id); setShowUniversityPicker(false); }}
                  >
                    <AppText variant="body" color={universityId === u.id ? 'brandTurquoise' : 'brandNavy'}>{u.name}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              label="Curso / Año"
              value={course}
              onChangeText={setCourse}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="school" />}
            />
          </>
        ))}

        {renderSection('Plan de Suscripción', 'diamond-outline', (
          <>
            <SegmentedButtons
              value={plan}
              onValueChange={(value) => setPlan(value as PlanType)}
              buttons={[
                { value: 'gratuito', label: 'Gratuito' },
                { value: 'premium', label: 'Premium' },
              ]}
              style={styles.segmentedButtons}
            />
            <View style={[styles.planCard, plan === 'premium' && styles.planCardPremium]}>
              {plan === 'gratuito' ? (
                <>
                  <View style={styles.planHeader}>
                    <Ionicons name="gift-outline" size={24} color={colors.brandNavy} />
                    <AppText variant="h3" weight="bold" color="brandNavy" style={{ marginLeft: spacing.sm }}>
                      Plan Gratuito
                    </AppText>
                  </View>
                  <View style={styles.planFeatures}>
                    <View style={styles.planFeature}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <AppText variant="body" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                        Hasta 5 pacientes asignados
                      </AppText>
                    </View>
                    <View style={styles.planFeature}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <AppText variant="body" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                        Acceso básico a procedimientos
                      </AppText>
                    </View>
                    <View style={styles.planFeature}>
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                      <AppText variant="body" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                        Sin historial completo
                      </AppText>
                    </View>
                    <View style={styles.planFeature}>
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                      <AppText variant="body" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                        Sin exportación de reportes
                      </AppText>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.planHeader}>
                    <Ionicons name="diamond" size={24} color={colors.brandTurquoise} />
                    <AppText variant="h3" weight="bold" color="brandTurquoise" style={{ marginLeft: spacing.sm }}>
                      Plan Premium
                    </AppText>
                    <View style={styles.priceBadge}>
                      <AppText variant="caption" weight="bold" color="white">
                        Gs. 50.000/mes
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.planFeatures}>
                    <View style={styles.planFeature}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <AppText variant="body" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                        Pacientes ilimitados
                      </AppText>
                    </View>
                    <View style={styles.planFeature}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <AppText variant="body" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                        Historial completo
                      </AppText>
                    </View>
                    <View style={styles.planFeature}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <AppText variant="body" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                        Exportación de reportes
                      </AppText>
                    </View>
                    <View style={styles.planFeature}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <AppText variant="body" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                        Soporte prioritario
                      </AppText>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    buttonColor={colors.brandTurquoise}
                    style={styles.upgradeButton}
                    onPress={() => Alert.alert('Premium', 'Funcionalidad de pago próximamente')}
                  >
                    Actualizar a Premium
                  </Button>
                </>
              )}
            </View>
          </>
        ))}

        {renderSection('Redes Sociales', 'share-social-outline', (
          <>
            <TextInput
              label="Facebook"
              value={facebook}
              onChangeText={setFacebook}
              mode="outlined"
              style={styles.input}
              placeholder="facebook.com/usuario"
              left={<TextInput.Icon icon="facebook" />}
            />
            <TextInput
              label="Instagram"
              value={instagram}
              onChangeText={setInstagram}
              mode="outlined"
              style={styles.input}
              placeholder="@usuario"
              left={<TextInput.Icon icon="instagram" />}
            />
            <TextInput
              label="TikTok"
              value={tiktok}
              onChangeText={setTiktok}
              mode="outlined"
              style={styles.input}
              placeholder="@usuario"
              left={<TextInput.Icon icon="music-note" />}
            />
          </>
        ))}

        {renderSection('Cambiar Contraseña', 'lock-closed-outline', (
          <>
            <TextInput
              label="Nueva Contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <TextInput
              label="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-check" />}
            />
          </>
        ))}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            textColor={colors.brandNavy}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            buttonColor={colors.brandTurquoise}
            loading={loading}
            disabled={loading}
          >
            Guardar Cambios
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  planCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planCardPremium: {
    borderColor: colors.brandTurquoise,
    backgroundColor: `${colors.brandTurquoise}08`,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceBadge: {
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  planFeatures: {
    gap: spacing.xs,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButton: {
    marginTop: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.brandNavy,
  },
  saveButton: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.brandTurquoise,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.brandTurquoise,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  pickerList: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: spacing.sm,
    maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    backgroundColor: `${colors.brandTurquoise}10`,
  },
})
