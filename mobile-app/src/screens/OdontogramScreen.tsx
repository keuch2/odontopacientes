import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Text, Button, Surface, Chip, ActivityIndicator, FAB, Menu, Divider } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { api } from '../lib/api'
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
  disponible: '#FEF3C7',
  proceso: '#DBEAFE',
  finalizado: '#D1FAE5',
  contraindicado: '#FEE2E2',
  ausente: '#D1D5DB',
  cancelado: '#E5E7EB',
}

const PROCEDURE_STATUS_BORDER_COLORS = {
  disponible: '#F59E0B',
  proceso: '#3B82F6',
  finalizado: '#10B981',
  contraindicado: '#EF4444',
  ausente: '#6B7280',
  cancelado: '#9CA3AF',
}

const PROCEDURE_STATUS_LABELS = {
  disponible: 'Disponible',
  proceso: 'En Proceso',
  finalizado: 'Finalizado',
  contraindicado: 'Contraindicado',
  ausente: 'Ausente',
  cancelado: 'Cancelado',
}

export default function OdontogramScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const params = route.params as { patientId: number; isPediatric?: boolean } | undefined
  const isPediatric = params?.isPediatric ?? false

  const [procedures, setProcedures] = useState<PatientProcedure[]>([])
  const [chairs, setChairs] = useState<Chair[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeeth, setSelectedTeeth] = useState<Set<string>>(new Set())
  const [modalVisible, setModalVisible] = useState(false)
  const [prosthesisLoading, setProsthesisLoading] = useState(false)
  const [filterMenuVisible, setFilterMenuVisible] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterChair, setFilterChair] = useState<string>('all')

  useEffect(() => {
    if (params?.patientId) {
      loadProcedures()
      loadChairs()
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

  // Aplicar filtros
  const filteredProcedures = procedures.filter(procedure => {
    if (filterStatus !== 'all' && procedure.status !== filterStatus) return false
    if (filterChair !== 'all' && procedure.chair.id.toString() !== filterChair) return false
    return true
  })

  const proceduresByTooth = filteredProcedures.reduce((acc, procedure) => {
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
    if (toothProcedures.some(p => p.status === 'contraindicado')) return 'contraindicado'
    
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

  const hasActiveProsthesis = () => {
    const prosthesisKeywords = ['completa superior', 'completa inferior', 'completa total']
    return procedures.some(p => {
      if (p.status === 'finalizado' || p.status === 'cancelado') return false
      const treatmentName = (p.treatment?.name || '').toLowerCase()
      return prosthesisKeywords.some(kw => treatmentName.includes(kw))
    })
  }

  // Prosthesis treatment IDs (from DB)
  const PROSTHESIS_TREATMENTS = {
    upper: { id: 46, name: 'Completa Superior' },
    lower: { id: 47, name: 'Completa Inferior' },
    total: { id: 48, name: 'Completa Total' },
  }
  const PROSTHESIS_CHAIR_ID = 6

  const getTeethForProsthesis = (type: 'upper' | 'lower' | 'total'): string[] => {
    const upper = (isPediatric ? PEDIATRIC_TOOTH_NUMBERS_UPPER : TOOTH_NUMBERS_UPPER).flat().map(String)
    const lower = (isPediatric ? PEDIATRIC_TOOTH_NUMBERS_LOWER : TOOTH_NUMBERS_LOWER).flat().map(String)
    if (type === 'upper') return upper
    if (type === 'lower') return lower
    return [...upper, ...lower]
  }

  const handleProsthesis = (type: 'upper' | 'lower' | 'total') => {
    if (hasActiveProsthesis()) {
      Alert.alert('Prótesis activa', 'Ya existe una prótesis activa. Debes finalizar o cancelar la prótesis existente antes de crear una nueva.')
      return
    }
    const treatment = PROSTHESIS_TREATMENTS[type]
    const teeth = getTeethForProsthesis(type)
    Alert.alert(
      'Crear Prótesis',
      `Esta acción creará un procedimiento de prótesis "${treatment.name}" para los dientes: ${teeth.join(', ')}.\n\n¿Quiere continuar?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          onPress: () => createProsthesisProcedure(type),
        },
      ]
    )
  }

  const createProsthesisProcedure = async (type: 'upper' | 'lower' | 'total') => {
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
      Alert.alert('Éxito', `Prótesis "${treatment.name}" creada correctamente para ${teeth.length} dientes`)
      loadProcedures()
    } catch (error: any) {
      console.error('Error creating prosthesis:', error)
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la prótesis')
    } finally {
      setProsthesisLoading(false)
    }
  }

  const handleAddProcedure = () => {
    if (selectedTeeth.size === 0) {
      Alert.alert('Seleccionar dientes', 'Debes seleccionar al menos un diente en el odontograma antes de agregar un procedimiento.')
      return
    }
    if (hasActiveProsthesis()) {
      Alert.alert('Prótesis activa', 'Existe una prótesis activa para este paciente. Debes finalizar o cancelar la prótesis antes de agregar nuevos procedimientos.')
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
        {status === 'ausente' && (
          <Text style={styles.absentMark}>✕</Text>
        )}
        {procedureCount > 0 && status !== 'ausente' && (
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
        <Text style={styles.title}>{isPediatric ? 'Odontograma Pediátrico' : 'Odontograma'}</Text>

        <Surface style={styles.infoCard}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Odontograma basado en procedimientos:</Text> Los colores indican el estado de los procedimientos asignados a cada diente. Toca un diente para ver sus procedimientos.
          </Text>
        </Surface>

        {/* Filtros */}
        <Surface style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtros</Text>
            {(filterStatus !== 'all' || filterChair !== 'all') && (
              <Button
                mode="text"
                onPress={() => {
                  setFilterStatus('all')
                  setFilterChair('all')
                }}
                compact
              >
                Limpiar
              </Button>
            )}
          </View>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Estado:</Text>
              <Menu
                visible={filterMenuVisible && filterStatus !== 'all'}
                onDismiss={() => setFilterMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setFilterMenuVisible(true)}
                    style={styles.filterButton}
                    contentStyle={styles.filterButtonContent}
                  >
                    {filterStatus === 'all' ? 'Todos' : PROCEDURE_STATUS_LABELS[filterStatus as keyof typeof PROCEDURE_STATUS_LABELS]}
                  </Button>
                }
              >
                <Menu.Item onPress={() => { setFilterStatus('all'); setFilterMenuVisible(false) }} title="Todos" />
                <Divider />
                <Menu.Item onPress={() => { setFilterStatus('disponible'); setFilterMenuVisible(false) }} title="Disponible" />
                <Menu.Item onPress={() => { setFilterStatus('proceso'); setFilterMenuVisible(false) }} title="En Proceso" />
                <Menu.Item onPress={() => { setFilterStatus('finalizado'); setFilterMenuVisible(false) }} title="Finalizado" />
                <Menu.Item onPress={() => { setFilterStatus('contraindicado'); setFilterMenuVisible(false) }} title="Contraindicado" />
                <Menu.Item onPress={() => { setFilterStatus('ausente'); setFilterMenuVisible(false) }} title="Ausente" />
              </Menu>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Cátedra:</Text>
              <Menu
                visible={filterMenuVisible && filterChair !== 'all'}
                onDismiss={() => setFilterMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setFilterMenuVisible(true)}
                    style={styles.filterButton}
                    contentStyle={styles.filterButtonContent}
                  >
                    {filterChair === 'all' ? 'Todas' : chairs.find(c => c.id.toString() === filterChair)?.name || 'Todas'}
                  </Button>
                }
              >
                <Menu.Item onPress={() => { setFilterChair('all'); setFilterMenuVisible(false) }} title="Todas" />
                <Divider />
                {chairs.map(chair => (
                  <Menu.Item
                    key={chair.id}
                    onPress={() => { setFilterChair(chair.id.toString()); setFilterMenuVisible(false) }}
                    title={chair.name}
                  />
                ))}
              </Menu>
            </View>
          </View>
          {(filterStatus !== 'all' || filterChair !== 'all') && (
            <Text style={styles.filterCount}>
              Mostrando {filteredProcedures.length} de {procedures.length} procedimientos
            </Text>
          )}
        </Surface>

        {/* Arcada Superior */}
        <Surface style={styles.arcadeContainer}>
          <Text style={styles.arcadeTitle}>Arcada Superior</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.arcadeScrollContent}
            nestedScrollEnabled={true}
          >
            <View style={styles.arcade}>
              <View style={styles.quadrant}>
                {(isPediatric ? PEDIATRIC_TOOTH_NUMBERS_UPPER : TOOTH_NUMBERS_UPPER)[0].map(renderTooth)}
              </View>
              <View style={styles.quadrant}>
                {(isPediatric ? PEDIATRIC_TOOTH_NUMBERS_UPPER : TOOTH_NUMBERS_UPPER)[1].map(renderTooth)}
              </View>
            </View>
          </ScrollView>
        </Surface>

        {/* Arcada Inferior */}
        <Surface style={styles.arcadeContainer}>
          <Text style={styles.arcadeTitle}>Arcada Inferior</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.arcadeScrollContent}
            nestedScrollEnabled={true}
          >
            <View style={styles.arcade}>
              <View style={styles.quadrant}>
                {(isPediatric ? PEDIATRIC_TOOTH_NUMBERS_LOWER : TOOTH_NUMBERS_LOWER)[0].map(renderTooth)}
              </View>
              <View style={styles.quadrant}>
                {(isPediatric ? PEDIATRIC_TOOTH_NUMBERS_LOWER : TOOTH_NUMBERS_LOWER)[1].map(renderTooth)}
              </View>
            </View>
          </ScrollView>
        </Surface>

        {/* Prótesis selector */}
        <Surface style={styles.quickSelectContainer}>
          <Text style={styles.quickSelectTitle}>Prótesis</Text>
          <View style={styles.quickSelectRow}>
            <Button mode="outlined" onPress={() => handleProsthesis('upper')} compact style={styles.quickSelectButton} labelStyle={styles.quickSelectLabel} disabled={prosthesisLoading}>Completo Superior</Button>
            <Button mode="outlined" onPress={() => handleProsthesis('lower')} compact style={styles.quickSelectButton} labelStyle={styles.quickSelectLabel} disabled={prosthesisLoading}>Completo Inferior</Button>
            <Button mode="outlined" onPress={() => handleProsthesis('total')} compact style={styles.quickSelectButton} labelStyle={styles.quickSelectLabel} disabled={prosthesisLoading}>Completo Total</Button>
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
                    onPress={() => (navigation as any).navigate('ProcedureView', { procedureId: procedure.id })}
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
            {Object.entries(PROCEDURE_STATUS_LABELS).map(([status, label]) => (
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
                <Text style={styles.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </Surface>

        {/* Botón Volver */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Volver
          </Button>
        </View>
      </ScrollView>

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoCard: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    elevation: 1,
  },
  filterCard: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  filterButton: {
    borderColor: '#D1D5DB',
  },
  filterButtonContent: {
    paddingVertical: 4,
  },
  filterCount: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
})
