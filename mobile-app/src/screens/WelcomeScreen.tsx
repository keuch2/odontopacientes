import React from 'react'
import { View, StyleSheet, ImageBackground, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

interface WelcomeScreenProps {
  onLogin: () => void
  onRegister: () => void
}

export default function WelcomeScreen({ onLogin, onRegister }: WelcomeScreenProps) {
  const handleHowItWorks = () => {
    // TODO: Implementar pantalla de cómo funciona
    console.log('Mostrar cómo funciona')
  }

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error al abrir URL:', err))
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section con imagen de fondo */}
        <ImageBackground
          source={require('../../imagenes_mobile/start-creen/hero.png')}
          style={styles.heroSection}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <AppText variant="h1" weight="bold" color="white" align="center" style={styles.heroTitle}>
              OdontoPacientes
            </AppText>
            <AppText variant="h3" weight="bold" color="white" align="center" style={styles.heroText}>
              Conectando alumnos y pacientes.
            </AppText>
          </View>
        </ImageBackground>

        {/* Features Section - Con iconos de Ionicons */}
        <View style={styles.featuresSection}>
          {/* Feature 1 - Búsqueda */}
          <View style={styles.featureItem}>
            <View style={styles.featureIconCircle}>
              <Ionicons name="search" size={32} color={colors.brandTurquoise} />
            </View>
            <AppText 
              variant="body" 
              align="center" 
              style={styles.featureText}
              color="brandTurquoise"
              weight="semibold"
            >
              Encontrá pacientes{'\n'}al instante
            </AppText>
          </View>

          {/* Feature 2 - Prácticas */}
          <View style={styles.featureItem}>
            <View style={styles.featureIconCircle}>
              <Ionicons name="medical" size={32} color={colors.brandTurquoise} />
            </View>
            <AppText 
              variant="body" 
              align="center" 
              style={styles.featureText}
              color="brandTurquoise"
              weight="semibold"
            >
              Prácticas en todos{'\n'}los procedimientos
            </AppText>
          </View>

          {/* Feature 3 - Paraguay */}
          <View style={styles.featureItem}>
            <View style={styles.featureIconCircle}>
              <Ionicons name="location" size={32} color={colors.brandTurquoise} />
            </View>
            <AppText 
              variant="body" 
              align="center" 
              style={styles.featureText}
              color="brandTurquoise"
              weight="semibold"
            >
              En todo el{'\n'}país
            </AppText>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleHowItWorks}
          >
            <AppText variant="body" weight="bold" color="white">
              ¿Cómo Funciona?
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]}
            onPress={onRegister}
          >
            <AppText variant="body" weight="bold" color="white">
              Regístrate
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]}
            onPress={onLogin}
          >
            <AppText variant="body" weight="bold" color="white">
              Iniciar Sesión
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <TouchableOpacity onPress={() => console.log('Sobre Nosotros')}>
            <AppText variant="caption" style={styles.footerLink}>
              Sobre Nosotros
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('Servicios')}>
            <AppText variant="caption" style={styles.footerLink}>
              Sobre Nuestros Servicios
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('Aviso Legal')}>
            <AppText variant="caption" style={styles.footerLink}>
              Aviso Legal
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('Contacto')}>
            <AppText variant="caption" style={styles.footerLink}>
              Contacto
            </AppText>
          </TouchableOpacity>

          {/* Social Icons */}
          <View style={styles.socialIcons}>
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => handleSocialLink('https://instagram.com/odontopacientes')}
            >
              <View style={styles.socialIconCircle}>
                <Ionicons name="logo-instagram" size={28} color="white" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => handleSocialLink('https://facebook.com/odontopacientes')}
            >
              <View style={styles.socialIconCircle}>
                <Ionicons name="logo-facebook" size={28} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    width: '100%',
    height: 350,
    position: 'relative',
    backgroundColor: colors.brandTurquoise,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
  },
  logoImage: {
    width: 120,
    height: 60,
  },
  heroTitle: {
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  heroText: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.white,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 60,
    height: 60,
    marginBottom: spacing.sm,
  },
  featureIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.brandTurquoise,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonsSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.brandTurquoise,
  },
  buttonSecondary: {
    backgroundColor: colors.brandNavy,
  },
  footerSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerLink: {
    color: colors.brandNavy,
    textDecorationLine: 'underline',
    marginVertical: 4,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  socialIcon: {
    marginHorizontal: spacing.sm,
  },
  socialIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
