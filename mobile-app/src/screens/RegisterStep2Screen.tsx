import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { AppText, AppButton } from '../components/ui'
import { AppHeader } from '../components/AppHeader'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { useRegister } from '../contexts/RegisterContext'

export default function RegisterStep2Screen({ navigation }: any) {
  const { registerData, updateRegisterData } = useRegister()
  const [profileImage, setProfileImage] = useState<string | null>(registerData.profileImage || null)

  useEffect(() => {
    if (profileImage) {
      updateRegisterData({ profileImage })
    }
  }, [profileImage])

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert(
        'Permisos Requeridos',
        'Necesitamos acceso a tu galería para seleccionar una foto.'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri)
      if (result.assets[0].base64) {
        updateRegisterData({ profileImageBase64: `data:image/jpeg;base64,${result.assets[0].base64}` })
      }
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert(
        'Permisos Requeridos',
        'Necesitamos acceso a tu cámara para tomar una foto.'
      )
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri)
      if (result.assets[0].base64) {
        updateRegisterData({ profileImageBase64: `data:image/jpeg;base64,${result.assets[0].base64}` })
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showMenu={false} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" color="brandNavy" weight="bold" style={styles.title}>
          Foto de Perfil
        </AppText>

        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <View style={styles.avatarIconHead} />
              <View style={styles.avatarIconBody} />
            </View>
          )}
        </View>

        <AppButton
          title="Elegir de Galería"
          onPress={pickImageFromGallery}
          fullWidth
          style={styles.button}
        />

        <AppButton
          title="Tomar Foto"
          onPress={takePhoto}
          fullWidth
          style={styles.button}
        />

        <AppButton
          title="Siguiente"
          onPress={() => {
            updateRegisterData({ profileImage })
            navigation.navigate('RegisterStep3')
          }}
          fullWidth
          variant="secondary"
          style={styles.nextButton}
        />

        <TouchableOpacity
          onPress={() => {
            updateRegisterData({ profileImage: null })
            navigation.navigate('RegisterStep3')
          }}
          style={styles.skipButton}
        >
          <AppText color="textMuted" align="center">
            Omitir por ahora
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
  },
  title: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  avatarPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIconHead: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#BDBDBD',
    marginBottom: 8,
  },
  avatarIconBody: {
    width: 100,
    height: 70,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    backgroundColor: '#BDBDBD',
  },
  button: {
    marginBottom: spacing.md,
  },
  nextButton: {
    marginTop: spacing.lg,
  },
  skipButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
})
