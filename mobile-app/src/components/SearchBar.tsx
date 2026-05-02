import React, { useState } from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { AppText } from './ui'
import { ToothPickerModal } from './ToothPickerModal'
import { api } from '../lib/api'

interface ChairOption {
  id: number
  name: string
  color?: string
}

export interface ChairFilter {
  chairId: number | null
  chairName: string | null
  chairColor?: string | null
  treatmentId: number | null
  treatmentName: string | null
  subclassId: number | null
  subclassName: string | null
}

const EMPTY_FILTER: ChairFilter = {
  chairId: null,
  chairName: null,
  chairColor: null,
  treatmentId: null,
  treatmentName: null,
  subclassId: null,
  subclassName: null,
}

type Step = 'chair' | 'treatment' | 'subclass'

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void
  showToothFilter?: boolean
  selectedTooth?: string | null
  onToothChange?: (tooth: string | null) => void
  showChairFilter?: boolean
  chairs?: ChairOption[]
  chairFilter?: ChairFilter
  onChairFilterChange?: (filter: ChairFilter) => void
}

export function SearchBar({
  placeholder = 'Buscar materias, pacientes, procedimientos, etc',
  value,
  onChangeText,
  onFocus,
  onBlur,
  showToothFilter = false,
  selectedTooth = null,
  onToothChange,
  showChairFilter = false,
  chairs = [],
  chairFilter = EMPTY_FILTER,
  onChairFilterChange,
}: SearchBarProps) {
  const [toothModalVisible, setToothModalVisible] = useState(false)
  const [chairModalVisible, setChairModalVisible] = useState(false)
  const [step, setStep] = useState<Step>('chair')
  // Selección temporal dentro del modal (antes de confirmar)
  const [pendingChair, setPendingChair] = useState<ChairOption | null>(null)
  const [pendingTreatment, setPendingTreatment] = useState<{ id: number; name: string } | null>(null)

  const hasFilter = chairFilter.chairId != null

  // Etiqueta del chip: muestra el nivel más específico seleccionado
  const chipLabel = chairFilter.subclassName
    || chairFilter.treatmentName
    || chairFilter.chairName
    || 'Cátedra'

  // Cargar detalles de la cátedra en pending (trae tratamientos con subclases)
  const { data: chairDetail, isLoading: chairDetailLoading } = useQuery({
    queryKey: ['chair-detail', pendingChair?.id],
    queryFn: async () => {
      if (!pendingChair) return null
      const response = await api.chairs.get(pendingChair.id)
      return response.data.data
    },
    enabled: !!pendingChair && chairModalVisible,
    staleTime: 5 * 60 * 1000,
  })

  const treatments: Array<{ id: number; name: string; subclasses?: Array<{ id: number; name: string }> }> =
    chairDetail?.treatments || []

  const selectedTreatmentObj = treatments.find(t => t.id === pendingTreatment?.id)
  const subclasses = selectedTreatmentObj?.subclasses || []

  const openChairModal = () => {
    // Reanudar en el paso más profundo ya seleccionado
    if (chairFilter.chairId != null) {
      const existingChair = chairs.find(c => c.id === chairFilter.chairId)
        || { id: chairFilter.chairId, name: chairFilter.chairName || '', color: chairFilter.chairColor || undefined }
      setPendingChair(existingChair)
      if (chairFilter.treatmentId != null) {
        setPendingTreatment({ id: chairFilter.treatmentId, name: chairFilter.treatmentName || '' })
        setStep(chairFilter.subclassId != null ? 'subclass' : 'treatment')
      } else {
        setStep('treatment')
      }
    } else {
      setPendingChair(null)
      setPendingTreatment(null)
      setStep('chair')
    }
    setChairModalVisible(true)
  }

  const closeModal = () => {
    setChairModalVisible(false)
  }

  const applyAndClose = (filter: ChairFilter) => {
    onChairFilterChange?.(filter)
    setChairModalVisible(false)
  }

  const clearFilter = () => {
    applyAndClose(EMPTY_FILTER)
  }

  const handleChairTap = (chair: ChairOption) => {
    setPendingChair(chair)
    setPendingTreatment(null)
    setStep('treatment')
  }

  const handleTreatmentTap = (treatment: { id: number; name: string; subclasses?: Array<{ id: number; name: string }> }) => {
    setPendingTreatment({ id: treatment.id, name: treatment.name })
    if (treatment.subclasses && treatment.subclasses.length > 0) {
      setStep('subclass')
    } else {
      // No tiene subclases: aplicar cátedra + tratamiento
      applyAndClose({
        chairId: pendingChair!.id,
        chairName: pendingChair!.name,
        chairColor: pendingChair!.color ?? null,
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        subclassId: null,
        subclassName: null,
      })
    }
  }

  const handleAllTreatments = () => {
    // Aplicar solo cátedra
    applyAndClose({
      chairId: pendingChair!.id,
      chairName: pendingChair!.name,
      chairColor: pendingChair!.color ?? null,
      treatmentId: null,
      treatmentName: null,
      subclassId: null,
      subclassName: null,
    })
  }

  const handleSubclassTap = (subclass: { id: number; name: string }) => {
    applyAndClose({
      chairId: pendingChair!.id,
      chairName: pendingChair!.name,
      chairColor: pendingChair!.color ?? null,
      treatmentId: pendingTreatment!.id,
      treatmentName: pendingTreatment!.name,
      subclassId: subclass.id,
      subclassName: subclass.name,
    })
  }

  const handleAllSubclasses = () => {
    applyAndClose({
      chairId: pendingChair!.id,
      chairName: pendingChair!.name,
      chairColor: pendingChair!.color ?? null,
      treatmentId: pendingTreatment!.id,
      treatmentName: pendingTreatment!.name,
      subclassId: null,
      subclassName: null,
    })
  }

  const goBack = () => {
    if (step === 'subclass') {
      setPendingTreatment(null)
      setStep('treatment')
    } else if (step === 'treatment') {
      setPendingChair(null)
      setStep('chair')
    }
  }

  const renderHeader = () => {
    const title =
      step === 'chair' ? 'Filtrar por Cátedra'
      : step === 'treatment' ? (pendingChair?.name || 'Tratamiento')
      : (pendingTreatment?.name || 'Sub-clase')

    return (
      <View style={styles.modalHeader}>
        <View style={styles.modalHeaderLeft}>
          {step !== 'chair' && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={22} color={colors.brandNavy} />
            </TouchableOpacity>
          )}
          <AppText variant="h3" color="brandNavy" weight="bold" style={{ flexShrink: 1 }} numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={colors.brandNavy} />
        </TouchableOpacity>
      </View>
    )
  }

  const renderChairStep = () => (
    <>
      {hasFilter && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
          <Ionicons name="close-circle" size={18} color={colors.error} />
          <AppText color="error" weight="semibold" style={{ marginLeft: 6, fontSize: 13 }}>Quitar filtro</AppText>
        </TouchableOpacity>
      )}
      <ScrollView style={styles.list}>
        {chairs.map((chair) => (
          <TouchableOpacity
            key={chair.id}
            style={[styles.row, chairFilter.chairId === chair.id && styles.rowActive]}
            onPress={() => handleChairTap(chair)}
          >
            <View style={[styles.dot, { backgroundColor: chair.color || colors.brandNavy }]} />
            <AppText
              color={chairFilter.chairId === chair.id ? 'white' : 'brandNavy'}
              weight={chairFilter.chairId === chair.id ? 'semibold' : 'normal'}
              style={styles.rowText}
            >
              {chair.name}
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={chairFilter.chairId === chair.id ? colors.white : colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  )

  const renderTreatmentStep = () => (
    <ScrollView style={styles.list}>
      <TouchableOpacity style={styles.row} onPress={handleAllTreatments}>
        <View style={[styles.dot, { backgroundColor: pendingChair?.color || colors.brandNavy }]} />
        <AppText color="brandNavy" weight="semibold" style={styles.rowText}>
          Todos los tratamientos
        </AppText>
        {chairFilter.treatmentId == null && chairFilter.chairId === pendingChair?.id && (
          <Ionicons name="checkmark" size={18} color={colors.brandNavy} />
        )}
      </TouchableOpacity>
      {chairDetailLoading ? (
        <ActivityIndicator color={colors.brandTurquoise} style={{ marginTop: spacing.lg }} />
      ) : treatments.length === 0 ? (
        <AppText color="textMuted" align="center" style={{ marginTop: spacing.lg }}>
          Esta cátedra no tiene tratamientos configurados.
        </AppText>
      ) : (
        treatments.map((treatment) => {
          const isSelected = chairFilter.treatmentId === treatment.id
          const hasSubclasses = (treatment.subclasses?.length || 0) > 0
          return (
            <TouchableOpacity
              key={treatment.id}
              style={[styles.row, isSelected && styles.rowActive]}
              onPress={() => handleTreatmentTap(treatment)}
            >
              <AppText
                color={isSelected ? 'white' : 'brandNavy'}
                weight={isSelected ? 'semibold' : 'normal'}
                style={[styles.rowText, { marginLeft: 0 }]}
              >
                {treatment.name}
              </AppText>
              {hasSubclasses ? (
                <Ionicons name="chevron-forward" size={18} color={isSelected ? colors.white : colors.textMuted} />
              ) : isSelected ? (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              ) : null}
            </TouchableOpacity>
          )
        })
      )}
    </ScrollView>
  )

  const renderSubclassStep = () => (
    <ScrollView style={styles.list}>
      <TouchableOpacity style={styles.row} onPress={handleAllSubclasses}>
        <AppText color="brandNavy" weight="semibold" style={[styles.rowText, { marginLeft: 0 }]}>
          Todas las sub-clases
        </AppText>
        {chairFilter.subclassId == null && chairFilter.treatmentId === pendingTreatment?.id && (
          <Ionicons name="checkmark" size={18} color={colors.brandNavy} />
        )}
      </TouchableOpacity>
      {subclasses.map((subclass) => {
        const isSelected = chairFilter.subclassId === subclass.id
        return (
          <TouchableOpacity
            key={subclass.id}
            style={[styles.row, isSelected && styles.rowActive]}
            onPress={() => handleSubclassTap(subclass)}
          >
            <AppText
              color={isSelected ? 'white' : 'brandNavy'}
              weight={isSelected ? 'semibold' : 'normal'}
              style={[styles.rowText, { marginLeft: 0 }]}
            >
              {subclass.name}
            </AppText>
            {isSelected && <Ionicons name="checkmark" size={18} color={colors.white} />}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )

  return (
    <>
      <View style={styles.container}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {showChairFilter && (
          <TouchableOpacity
            style={[styles.filterButton, hasFilter && styles.filterButtonActive]}
            onPress={openChairModal}
          >
            <Ionicons name="school" size={14} color={hasFilter ? colors.white : colors.brandNavy} />
            <AppText
              color={hasFilter ? 'white' : 'brandNavy'}
              style={[styles.filterButtonText, hasFilter && { maxWidth: 80 }]}
              weight="semibold"
              numberOfLines={1}
            >
              {chipLabel}
            </AppText>
          </TouchableOpacity>
        )}
        {showToothFilter && (
          <TouchableOpacity
            style={[styles.filterButton, selectedTooth && styles.filterButtonActive]}
            onPress={() => setToothModalVisible(true)}
          >
            <Ionicons name="medical" size={14} color={selectedTooth ? colors.white : colors.brandNavy} />
            <AppText
              color={selectedTooth ? 'white' : 'brandNavy'}
              style={styles.filterButtonText}
              weight="semibold"
            >
              {selectedTooth ? `#${selectedTooth}` : 'Diente'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      <ToothPickerModal
        visible={toothModalVisible}
        onClose={() => setToothModalVisible(false)}
        selectedTooth={selectedTooth ?? null}
        onToothChange={(tooth) => onToothChange?.(tooth)}
      />

      {showChairFilter && (
        <Modal
          visible={chairModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {renderHeader()}
              {step === 'chair' && renderChairStep()}
              {step === 'treatment' && renderTreatmentStep()}
              {step === 'subclass' && renderSubclassStep()}
            </View>
          </View>
        </Modal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.searchBackground,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
    padding: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brandNavy,
    marginLeft: spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  filterButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  backBtn: {
    marginRight: spacing.xs,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  rowActive: {
    backgroundColor: colors.brandNavy,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    marginLeft: spacing.xs,
  },
})
