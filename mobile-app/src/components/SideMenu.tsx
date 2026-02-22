import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AppText } from './ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { useAuthStore } from '../store/auth'
import { getStorageUrl } from '../lib/storage'

const { width } = Dimensions.get('window')
const MENU_WIDTH = width * 0.8

interface SideMenuProps {
  visible: boolean
  onClose: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  route?: string
  action?: () => void
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const navigation = useNavigation<any>()
  const { user, logout } = useAuthStore()
  const slideAnim = React.useRef(new Animated.Value(-MENU_WIDTH)).current

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: 'person-circle-outline',
      route: 'ProfileEdit',
    },
    {
      id: 'my-patients',
      label: 'Mis Pacientes',
      icon: 'people-outline',
      route: 'MenuMyPatients',
    },
    {
      id: 'procedure-history',
      label: 'Historial de Procedimientos',
      icon: 'document-text-outline',
      route: 'ProcedureHistory',
    },
  ]

  const handleMenuPress = (item: MenuItem) => {
    onClose()
    if (item.route) {
      setTimeout(() => {
        navigation.navigate('Catedras', { screen: item.route })
      }, 300)
    } else if (item.action) {
      item.action()
    }
  }

  const handleLogout = () => {
    onClose()
    setTimeout(() => {
      logout()
    }, 300)
  }

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.menuContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* Header del menú */}
            <View style={styles.header}>
              <Image
                source={require('../../imagenes_mobile/logo-app.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={colors.brandNavy} />
              </TouchableOpacity>
            </View>

            {/* Info del usuario */}
            <View style={styles.userSection}>
              {(user as any)?.profile_image ? (
                <Image
                  source={{ uri: getStorageUrl((user as any).profile_image) || '' }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarContainer}>
                  <AppText variant="h2" color="white" weight="bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AppText>
                </View>
              )}
              <View style={styles.userInfo}>
                <AppText variant="h3" weight="bold" color="brandNavy" numberOfLines={1}>
                  {user?.name || 'Usuario'}
                </AppText>
                <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                  {user?.email || ''}
                </AppText>
                <View style={styles.roleBadge}>
                  <AppText variant="caption" weight="semibold" color="white">
                    {user?.role === 'alumno' ? 'Estudiante' : 
                     user?.role === 'coordinador' ? 'Coordinador' :
                     user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Separador */}
            <View style={styles.separator} />

            {/* Items del menú */}
            <View style={styles.menuItems}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon} size={24} color={colors.brandTurquoise} />
                  </View>
                  <AppText variant="body" weight="semibold" color="brandNavy">
                    {item.label}
                  </AppText>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Cerrar sesión */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color={colors.error} />
                <AppText variant="body" weight="semibold" style={{ color: colors.error, marginLeft: spacing.sm }}>
                  Cerrar Sesión
                </AppText>
              </TouchableOpacity>

              <AppText variant="caption" color="textSecondary" style={styles.version}>
                OdontoPacientes v1.0.0
              </AppText>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: MENU_WIDTH,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 140,
    height: 36,
  },
  closeButton: {
    padding: spacing.xs,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brandTurquoise,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  roleBadge: {
    backgroundColor: colors.brandNavy,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  menuItems: {
    paddingVertical: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.brandTurquoise}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  chevron: {
    marginLeft: 'auto',
  },
  spacer: {
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
