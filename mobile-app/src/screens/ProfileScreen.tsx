import React from 'react'
import { View, ScrollView, StyleSheet, Image } from 'react-native'
import { Card, Text, List, Button, Divider, Avatar } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../store/auth'
import { getStorageUrl } from '../lib/storage'

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header del perfil */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            {(user as any)?.profile_image ? (
              <Image
                source={{ uri: getStorageUrl((user as any).profile_image) || '' }}
                style={styles.avatarImage}
              />
            ) : (
              <Avatar.Text 
                size={80} 
                label={user?.name?.charAt(0).toUpperCase() || 'U'}
                style={styles.avatar}
              />
            )}
            <Text variant="headlineSmall" style={styles.userName}>
              {user?.name}
            </Text>
            <Text variant="bodyMedium" style={styles.userEmail}>
              {user?.email}
            </Text>
            <Text variant="bodySmall" style={styles.userRole}>
              {user?.role === 'alumno' ? 'Estudiante' : 
               user?.role === 'coordinador' ? 'Coordinador' :
               user?.role === 'admin' ? 'Administrador' : 'Usuario'}
            </Text>
          </Card.Content>
        </Card>

        {/* Información académica */}
        {user?.faculty && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Información Académica
              </Text>
              <List.Item
                title="Facultad"
                description={user.faculty.name}
                left={(props) => <List.Icon {...props} icon="school" />}
              />
              {user.faculty.university && (
                <List.Item
                  title="Universidad"
                  description={user.faculty.university.name}
                  left={(props) => <List.Icon {...props} icon="domain" />}
                />
              )}
              {user.student && (
                <>
                  <List.Item
                    title="Número de Estudiante"
                    description={user.student.student_number}
                    left={(props) => <List.Icon {...props} icon="card-account-details" />}
                  />
                  <List.Item
                    title="Año"
                    description={`${user.student.year}° Año`}
                    left={(props) => <List.Icon {...props} icon="calendar" />}
                  />
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Estadísticas del usuario */}
        {user?.role === 'alumno' && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Mis Estadísticas
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>0</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>Casos Activos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>0</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>Completados</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>0</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>Sesiones</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Configuración */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Configuración
            </Text>
            <List.Item
              title="Notificaciones"
              description="Gestionar preferencias de notificaciones"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* navegar a notificaciones */}}
            />
            <Divider />
            <List.Item
              title="Privacidad"
              description="Configuración de privacidad y datos"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* navegar a privacidad */}}
            />
            <Divider />
            <List.Item
              title="Ayuda"
              description="Soporte y preguntas frecuentes"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* navegar a ayuda */}}
            />
          </Card.Content>
        </Card>

        {/* Información de la aplicación */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Acerca de la Aplicación
            </Text>
            <List.Item
              title="Versión"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="Términos y Condiciones"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* navegar a términos */}}
            />
            <List.Item
              title="Política de Privacidad"
              left={(props) => <List.Icon {...props} icon="shield-check" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* navegar a política */}}
            />
          </Card.Content>
        </Card>

        {/* Botón de cerrar sesión */}
        <Card style={styles.logoutCard}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              buttonColor="#fef2f2"
              textColor="#dc2626"
              icon="logout"
            >
              Cerrar Sesión
            </Button>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            OdontoPacientes v1.0.0{'\n'}
            Sistema de Gestión Académica Odontológica
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 16,
    backgroundColor: '#3b82f6',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  userName: {
    color: '#0f172a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#64748b',
    marginBottom: 8,
  },
  userRole: {
    color: '#3b82f6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  logoutCard: {
    marginBottom: 24,
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  logoutButton: {
    borderColor: '#dc2626',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
})
