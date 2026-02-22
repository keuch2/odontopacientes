import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, ActivityIndicator, Alert, Linking } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { AppText } from '../components/ui'
import { SearchBar } from '../components/SearchBar'
import { PatientCard } from '../components/PatientCard'
import { useDebounce } from '../hooks/useDebounce'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface Chair {
  id: number
  name: string
  key: string
  color: string
}

interface PatientSearchResult {
  id: number
  full_name: string
  age: number
  city: string
  phone: string
  procedures_count?: {
    disponible: number
    proceso: number
    finalizado: number
  }
}

interface Ad {
  id: number
  title: string
  image_url: string
  link_url: string | null
}

const catedraIcons: Record<string, any> = {
  'cirugias': require('../../assets/images/catedras/cirugias.png'),
  'periodoncia': require('../../assets/images/catedras/periodoncia.png'),
  'pediatria': require('../../assets/images/catedras/pediatria.png'),
  'operatoria': require('../../assets/images/catedras/operatoria.png'),
  'endodoncia': require('../../assets/images/catedras/endodoncia.png'),
  'protesis': require('../../assets/images/catedras/protesis.png'),
  'preventiva': require('../../assets/images/catedras/preventiva.png'),
  'implantes': require('../../assets/images/catedras/implantes.png'),
}

const defaultIcon = require('../../assets/images/catedras/operatoria.png')

export default function CatedrasScreen({ navigation }: any) {
  const [searchText, setSearchText] = useState('')
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const debouncedSearchText = useDebounce(searchText, 500)

  // Cargar banners publicitarios desde la API
  const { data: adsData } = useQuery({
    queryKey: ['ads', 'dashboard_banner'],
    queryFn: async () => {
      try {
        const response = await api.ads.getActive('dashboard_banner')
        return response.data.data || []
      } catch (error) {
        console.log('Error fetching ads, using fallback')
        return []
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const activeBanner = (adsData as Ad[] || [])[0]

  const handleBannerPress = async () => {
    if (activeBanner?.link_url) {
      try {
        await api.ads.trackClick(activeBanner.id)
        await Linking.openURL(activeBanner.link_url)
      } catch (error) {
        console.log('Error opening banner link')
      }
    }
  }

  // Cargar cátedras desde la API
  const { data: chairsData, isLoading: chairsLoading } = useQuery({
    queryKey: ['chairs'],
    queryFn: async () => {
      const response = await api.chairs.list()
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  // Buscar pacientes cuando hay texto de búsqueda
  const { data: searchResults, isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ['patients-search', debouncedSearchText, selectedTooth],
    queryFn: async () => {
      if (!debouncedSearchText.trim() && !selectedTooth) return []
      const params: any = {}
      if (debouncedSearchText.trim()) params.q = debouncedSearchText
      if (selectedTooth) params.tooth_fdi = selectedTooth
      const response = await api.patients.search(params)
      return response.data.data || []
    },
    enabled: debouncedSearchText.trim().length > 0 || !!selectedTooth,
  })

  // Transformar datos de búsqueda al formato esperado por PatientCard
  const filteredPatients = (searchResults || []).map((patient: any) => ({
    id: patient.id,
    name: patient.full_name || patient.name,
    age: patient.age || 0,
    city: patient.city || '',
    university: patient.faculty?.name || patient.university || '',
    catedra: patient.chair?.name || '',
    tratamientos: patient.treatments?.map((t: any) => t.name) || [],
    disponibles: patient.procedures_count?.disponible || 0,
    enProceso: patient.procedures_count?.proceso || 0,
    finalizados: patient.procedures_count?.finalizado || 0,
  }))

  // Mostrar pacientes si hay texto de búsqueda, sino mostrar cátedras
  const shouldShowPatients = searchText.trim().length > 0 || !!selectedTooth

  // Obtener icono para una cátedra basado en su key o nombre
  const getChairIcon = (chair: Chair) => {
    const key = (chair.key || chair.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return catedraIcons[key] || defaultIcon
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Barra de búsqueda */}
        <View style={styles.searchWrapper}>
          <SearchBar 
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar pacientes, cátedras, tratamientos..."
            showToothFilter
            selectedTooth={selectedTooth}
            onToothChange={setSelectedTooth}
          />
        </View>

        <View style={styles.contentContainer}>
          {shouldShowPatients ? (
            // Mostrar resultados de búsqueda de pacientes
            <>
              <AppText variant="h2" color="brandNavy" weight="bold" style={styles.sectionTitle}>
                Resultados de búsqueda
              </AppText>
              
              {isSearching ? (
                // Estado de carga
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.brandTurquoise} />
                  <AppText color="textSecondary" style={styles.loadingText}>
                    Buscando pacientes...
                  </AppText>
                </View>
              ) : filteredPatients.length > 0 ? (
                <>
                  <AppText color="textSecondary" style={styles.resultCount}>
                    {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
                  </AppText>
                  {filteredPatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
                    />
                  ))}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <AppText color="textMuted" align="center">
                    No se encontraron pacientes que coincidan con "{debouncedSearchText}"
                  </AppText>
                  <AppText color="textMuted" align="center" style={styles.emptyHint}>
                    Intenta buscar por nombre de paciente, cátedra o tratamiento
                  </AppText>
                </View>
              )}
            </>
          ) : (
            // Mostrar grid de cátedras (pantalla inicial)
            <>
              {/* Banner Publicitario */}
              <TouchableOpacity 
                style={styles.bannerContainer} 
                activeOpacity={0.9}
                onPress={handleBannerPress}
                disabled={!activeBanner?.link_url}
              >
                {activeBanner?.image_url ? (
                  <Image
                    source={{ uri: activeBanner.image_url }}
                    style={styles.banner}
                    resizeMode="cover"
                  />
                ) : (
                  <ImageBackground
                    source={require('../../assets/images/banner_publicidad.png')}
                    style={styles.banner}
                    imageStyle={styles.bannerImage}
                  />
                )}
              </TouchableOpacity>

              {/* Título */}
              <AppText variant="h2" color="brandNavy" weight="bold" style={styles.sectionTitle}>
                Cátedras
              </AppText>

              {/* Grid de Cátedras */}
              {chairsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.brandTurquoise} />
                  <AppText color="textSecondary" style={styles.loadingText}>
                    Cargando cátedras...
                  </AppText>
                </View>
              ) : (
                <View style={styles.grid}>
                  {(chairsData || []).map((chair: Chair) => (
                    <TouchableOpacity 
                      key={chair.id} 
                      style={[styles.catedraCard, chair.color ? { backgroundColor: chair.color } : null]}
                      onPress={() => navigation.navigate('ChairPatients', { 
                        chairId: chair.id,
                        chairName: chair.name 
                      })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.catedraIconContainer}>
                        <Image source={getChairIcon(chair)} style={styles.catedraIcon} resizeMode="contain" />
                      </View>
                      <AppText color="white" weight="semibold" align="center" style={styles.catedraName}>
                        {chair.name}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.spacer} />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  searchWrapper: {
    backgroundColor: colors.white,
    paddingBottom: spacing.sm,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
  },
  bannerContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  banner: {
    width: '100%',
    height: 140,
  },
  bannerImage: {
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catedraCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: colors.brandNavy,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catedraIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  catedraIcon: {
    width: 45,
    height: 45,
  },
  catedraName: {
    fontSize: 14,
  },
  spacer: {
    height: spacing.xxl,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  resultCount: {
    marginBottom: spacing.md,
    fontSize: 14,
  },
  emptyHint: {
    marginTop: spacing.sm,
    fontSize: 13,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
})
