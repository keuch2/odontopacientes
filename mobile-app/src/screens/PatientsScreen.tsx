import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { AppText } from '../components/ui'
import { AppHeader } from '../components/AppHeader'
import { SearchBar } from '../components/SearchBar'
import { PatientCard } from '../components/PatientCard'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

export default function PatientsScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChair, setSelectedChair] = useState<string | null>(null)

  const { data: chairs, isLoading: loadingChairs } = useQuery<any[]>({
    queryKey: ['chairs'],
    queryFn: async () => {
      const response = await api.get('/chairs')
      return response.data.data || []
    },
  })

  const { data: patients, isLoading: isLoading } = useQuery<any[]>({
    queryKey: ['patients', searchQuery, selectedChair],
    queryFn: async () => {
      const response = await api.get('/patients', {
        params: {
          search: searchQuery,
          chair: selectedChair,
        },
      })
      return response.data.data || []
    },
  })

  const filteredPatients = useMemo(() => {
    if (!patients) return []

    return patients.filter((patient: any) => {
      const matchesSearch = patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           patient.city.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesChair = !selectedChair || patient.procedures?.[0]?.treatment?.chair?.key === selectedChair
      return matchesSearch && matchesChair
    })
  }, [patients, searchQuery, selectedChair])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SearchBar
          placeholder="Buscar pacientes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
        />

        {/* Filtros por cátedra */}
        <AppText variant="body" weight="semibold" style={styles.filterTitle}>
          Filtros de Cátedras
        </AppText>
        {loadingChairs ? (
          <View style={styles.loadingFilters}>
            <ActivityIndicator size="small" color={colors.brandTurquoise} />
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedChair && styles.filterChipActive
              ]}
              onPress={() => setSelectedChair(null)}
            >
              <AppText 
                variant="caption" 
                weight="semibold"
                color={!selectedChair ? 'white' : 'textSecondary'}
              >
                Todas
              </AppText>
            </TouchableOpacity>

            {(chairs || []).map((chair: any) => (
              <TouchableOpacity
                key={chair.id}
                style={[
                  styles.filterChip,
                  selectedChair === chair.id && styles.filterChipActive,
                  selectedChair === chair.id && { backgroundColor: chair.color }
                ]}
                onPress={() => setSelectedChair(chair.id)}
              >
                <AppText 
                  variant="caption" 
                  weight="semibold"
                  color={selectedChair === chair.id ? 'white' : 'textSecondary'}
                >
                  {chair.name}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Lista de pacientes */}
        <AppText variant="body" weight="semibold" style={styles.resultsTitle}>
          {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} disponible{filteredPatients.length !== 1 ? 's' : ''}
        </AppText>

        <View style={styles.contentContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandTurquoise} />
              <AppText color="textMuted" style={styles.loadingText}>
                Cargando pacientes...
              </AppText>
            </View>
          ) : filteredPatients.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText color="textMuted" align="center">
                No se encontraron pacientes
              </AppText>
              {(selectedChair || searchQuery) && (
                <AppText color="textMuted" align="center" style={styles.emptyMessage}>
                  Intenta ajustar los filtros de búsqueda
                </AppText>
              )}
            </View>
          ) : (
            filteredPatients.map((patient: any) => (
              <PatientCard
                key={patient.id}
                patient={{
                  id: patient.id,
                  name: patient.full_name || `${patient.first_name} ${patient.last_name}`,
                  age: patient.age || 0,
                  city: patient.city || '',
                  university: patient.faculty?.name || '',
                  disponibles: patient.procedures_count?.disponible || 0,
                  enProceso: patient.procedures_count?.proceso || 0,
                  finalizados: patient.procedures_count?.finalizado || 0,
                }}
                onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
              />
            ))
          )}

          <View style={styles.spacer} />
        </View>
      </View>
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
  searchbar: {
    marginBottom: 16,
  },
  filterTitle: {
    color: '#0f172a',
    marginBottom: 8,
    fontWeight: '600',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 2,
  },
  filterChip: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#06b6d4',
  },
  loadingFilters: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
  resultsTitle: {
    color: '#0f172a',
    marginBottom: 12,
    fontWeight: '600',
  },
  patientsList: {
    flex: 1,
  },
  patientCard: {
    marginBottom: 12,
  },
  patientHeader: {
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
  chairChip: {
    borderWidth: 1,
  },
  patientInfo: {
    marginBottom: 8,
  },
  patientDetail: {
    color: '#64748b',
    marginBottom: 4,
  },
  procedures: {
    color: '#475569',
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#64748b',
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#94a3b8',
    textAlign: 'center',
  },
})
