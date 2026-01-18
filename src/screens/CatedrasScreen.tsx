import React, { useState, useMemo, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText } from '../components/ui'
import { AppHeader } from '../components/AppHeader'
import { SearchBar } from '../components/SearchBar'
import { PatientCard } from '../components/PatientCard'
import { useDebounce } from '../hooks/useDebounce'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

const catedras = [
  { id: 1, name: 'Cirugías', icon: require('../../assets/images/catedras/cirugias.png') },
  { id: 2, name: 'Periodoncia', icon: require('../../assets/images/catedras/periodoncia.png') },
  { id: 3, name: 'Pediatría', icon: require('../../assets/images/catedras/pediatria.png') },
  { id: 4, name: 'Operatoria', icon: require('../../assets/images/catedras/operatoria.png') },
  { id: 5, name: 'Endodoncia', icon: require('../../assets/images/catedras/endodoncia.png') },
  { id: 6, name: 'Prótesis', icon: require('../../assets/images/catedras/protesis.png') },
  { id: 7, name: 'Preventiva', icon: require('../../assets/images/catedras/preventiva.png') },
  { id: 8, name: 'Implantes', icon: require('../../assets/images/catedras/implantes.png') },
]

const mockPatients = [
  {
    id: 1,
    name: 'Cármen Herrera',
    age: 20,
    city: 'Villarrica',
    university: 'Universidad del Norte',
    catedra: 'Cirugías',
    tratamientos: ['CIRUGÍA SIMPLE', 'EXTRACCIÓN'],
    disponibles: 3,
    enProceso: 3,
    finalizados: 3,
  },
  {
    id: 2,
    name: 'Juan Pérez',
    age: 35,
    city: 'Asunción',
    university: 'Universidad Nacional',
    catedra: 'Periodoncia',
    tratamientos: ['LIMPIEZA DENTAL', 'TRATAMIENTO PERIODONTAL'],
    disponibles: 2,
    enProceso: 1,
    finalizados: 5,
  },
  {
    id: 3,
    name: 'María González',
    age: 28,
    city: 'Encarnación',
    university: 'Universidad del Norte',
    catedra: 'Endodoncia',
    tratamientos: ['ENDODONCIA', 'CONDUCTO'],
    disponibles: 1,
    enProceso: 2,
    finalizados: 4,
  },
  {
    id: 4,
    name: 'Pedro Martínez',
    age: 42,
    city: 'Villarrica',
    university: 'Universidad Católica',
    catedra: 'Prótesis',
    tratamientos: ['PRÓTESIS DENTAL', 'CORONA'],
    disponibles: 4,
    enProceso: 0,
    finalizados: 2,
  },
]

export default function CatedrasScreen({ navigation }: any) {
  const [searchText, setSearchText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchText = useDebounce(searchText, 500)

  const handleMenuPress = () => {
    console.log('Abrir menú')
  }

  // Simular loading cuando el usuario está escribiendo
  useEffect(() => {
    if (searchText !== debouncedSearchText && searchText.trim().length > 0) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchText, debouncedSearchText])

  // Filtrar pacientes según el texto de búsqueda debounced (nombre, cátedra o tratamiento)
  const filteredPatients = useMemo(() => {
    if (!debouncedSearchText.trim()) return []
    
    // Aquí debería ir la llamada a la API
    // const response = await api.patients.search({ q: debouncedSearchText })
    
    const searchLower = debouncedSearchText.toLowerCase()
    return mockPatients.filter((patient) => {
      const matchesName = patient.name.toLowerCase().includes(searchLower)
      const matchesCatedra = patient.catedra.toLowerCase().includes(searchLower)
      const matchesTratamiento = patient.tratamientos.some(t => 
        t.toLowerCase().includes(searchLower)
      )
      return matchesName || matchesCatedra || matchesTratamiento
    })
  }, [debouncedSearchText])

  // Mostrar pacientes si hay texto de búsqueda, sino mostrar cátedras
  const shouldShowPatients = searchText.trim().length > 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <AppHeader onMenuPress={handleMenuPress} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Barra de búsqueda */}
        <View style={styles.searchWrapper}>
          <SearchBar 
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar pacientes, cátedras, tratamientos..."
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
              <TouchableOpacity style={styles.bannerContainer} activeOpacity={0.9}>
                <ImageBackground
                  source={require('../../assets/images/banner_publicidad.png')}
                  style={styles.banner}
                  imageStyle={styles.bannerImage}
                />
              </TouchableOpacity>

              {/* Título */}
              <AppText variant="h2" color="brandNavy" weight="bold" style={styles.sectionTitle}>
                Cátedras
              </AppText>

              {/* Grid de Cátedras */}
              <View style={styles.grid}>
                {catedras.map((catedra) => (
                  <TouchableOpacity 
                    key={catedra.id} 
                    style={styles.catedraCard}
                    onPress={() => navigation.navigate('ChairPatients', { chairName: catedra.name })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.catedraIconContainer}>
                      <Image source={catedra.icon} style={styles.catedraIcon} resizeMode="contain" />
                    </View>
                    <AppText color="white" weight="semibold" align="center" style={styles.catedraName}>
                      {catedra.name}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={styles.spacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
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
