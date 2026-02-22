import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Card, Text, Button, Chip, ProgressBar } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function MyAssignmentsScreen() {
  const mockAssignments = [
    {
      id: 1,
      patient: 'María González',
      treatment: 'Extracción de muela del juicio',
      chair: 'Cirugías',
      chairColor: '#ef4444',
      sessionsCompleted: 2,
      totalSessions: 3,
      progress: 0.67,
      status: 'activa',
      nextSession: '2024-10-02'
    },
    {
      id: 2,
      patient: 'Carlos Mendoza',
      treatment: 'Tratamiento de conducto',
      chair: 'Endodoncia',
      chairColor: '#8b5cf6',
      sessionsCompleted: 4,
      totalSessions: 4,
      progress: 1.0,
      status: 'completada',
      completedDate: '2024-09-25'
    }
  ]

  const activeAssignments = mockAssignments.filter(a => a.status === 'activa')
  const completedAssignments = mockAssignments.filter(a => a.status === 'completada')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activa': return '#3b82f6'
      case 'completada': return '#10b981'
      case 'abandonada': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'activa': return 'En Progreso'
      case 'completada': return 'Completada'
      case 'abandonada': return 'Abandonada'
      default: return status
    }
  }

  const renderAssignment = (assignment: any) => (
    <Card key={assignment.id} style={styles.assignmentCard}>
      <Card.Content>
        <View style={styles.assignmentHeader}>
          <Text variant="titleMedium" style={styles.patientName}>
            {assignment.patient}
          </Text>
          <Chip 
            compact
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(assignment.status) + '20' }
            ]}
            textStyle={{ color: getStatusColor(assignment.status) }}
          >
            {getStatusText(assignment.status)}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.treatmentName}>
          {assignment.treatment}
        </Text>

        <View style={styles.chairInfo}>
          <View 
            style={[
              styles.chairIndicator,
              { backgroundColor: assignment.chairColor }
            ]}
          />
          <Text variant="bodySmall" style={styles.chairText}>
            Cátedra de {assignment.chair}
          </Text>
        </View>

        {assignment.status === 'activa' && (
          <>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text variant="bodySmall" style={styles.progressLabel}>
                  Progreso de sesiones
                </Text>
                <Text variant="bodySmall" style={styles.progressCount}>
                  {assignment.sessionsCompleted}/{assignment.totalSessions}
                </Text>
              </View>
              <ProgressBar 
                progress={assignment.progress} 
                color={assignment.chairColor}
                style={styles.progressBar}
              />
            </View>

            {assignment.nextSession && (
              <View style={styles.nextSession}>
                <Text variant="bodySmall" style={styles.nextSessionLabel}>
                  📅 Próxima sesión: {new Date(assignment.nextSession).toLocaleDateString('es-ES')}
                </Text>
              </View>
            )}
          </>
        )}

        {assignment.status === 'completada' && assignment.completedDate && (
          <View style={styles.completedInfo}>
            <Text variant="bodySmall" style={styles.completedDate}>
              ✅ Completado el {new Date(assignment.completedDate).toLocaleDateString('es-ES')}
            </Text>
          </View>
        )}
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button mode="outlined" compact>
          Ver Detalle
        </Button>
        {assignment.status === 'activa' && (
          <Button mode="contained" compact>
            Ver Detalles
          </Button>
        )}
      </Card.Actions>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Casos Activos */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Casos Activos ({activeAssignments.length})
          </Text>
          
          {activeAssignments.length > 0 ? (
            activeAssignments.map(renderAssignment)
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No tienes casos activos
                </Text>
                <Text variant="bodyMedium" style={styles.emptyMessage}>
                  Busca pacientes disponibles para comenzar nuevos tratamientos
                </Text>
                <Button 
                  mode="contained" 
                  style={styles.emptyButton}
                  onPress={() => {/* navegar a buscar pacientes */}}
                >
                  Buscar Pacientes
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Casos Completados */}
        {completedAssignments.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Casos Completados ({completedAssignments.length})
            </Text>
            {completedAssignments.map(renderAssignment)}
          </View>
        )}

        {/* Estadísticas rápidas */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Mi Progreso
          </Text>
          
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {mockAssignments.length}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Total Casos
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {completedAssignments.length}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Completados
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>
                    {mockAssignments.reduce((sum, a) => sum + a.sessionsCompleted, 0)}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Sesiones
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  assignmentCard: {
    marginBottom: 12,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    borderWidth: 1,
  },
  treatmentName: {
    color: '#475569',
    marginBottom: 8,
  },
  chairInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chairIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chairText: {
    color: '#64748b',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#64748b',
  },
  progressCount: {
    color: '#475569',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  nextSession: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  nextSessionLabel: {
    color: '#475569',
  },
  completedInfo: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  completedDate: {
    color: '#166534',
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  emptyCard: {
    backgroundColor: '#f8fafc',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    color: '#64748b',
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
})
