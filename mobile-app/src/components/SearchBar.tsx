import React, { useState } from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { AppText } from './ui'
import { ToothPickerModal } from './ToothPickerModal'

interface ChairOption {
  id: number
  name: string
  color?: string
}

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
  selectedChairId?: number | null
  selectedChairName?: string | null
  onChairChange?: (id: number | null, name: string | null) => void
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
  selectedChairId = null,
  selectedChairName = null,
  onChairChange,
}: SearchBarProps) {
  const [toothModalVisible, setToothModalVisible] = useState(false)
  const [chairModalVisible, setChairModalVisible] = useState(false)

  const handleChairSelect = (id: number | null, name: string | null) => {
    onChairChange?.(id, name)
    setChairModalVisible(false)
  }

  return (
    <>
      <View style={styles.container}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textMuted}
          style={styles.icon}
        />
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
            style={[
              styles.filterButton,
              selectedChairId != null && styles.filterButtonActive,
            ]}
            onPress={() => setChairModalVisible(true)}
          >
            <Ionicons name="school" size={14} color={selectedChairId != null ? colors.white : colors.brandNavy} />
            <AppText
              color={selectedChairId != null ? 'white' : 'brandNavy'}
              style={[styles.filterButtonText, selectedChairId != null && { maxWidth: 60 }]}
              weight="semibold"
              numberOfLines={1}
            >
              {selectedChairId != null ? selectedChairName : 'Cátedra'}
            </AppText>
          </TouchableOpacity>
        )}
        {showToothFilter && (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedTooth && styles.filterButtonActive,
            ]}
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
          onRequestClose={() => setChairModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <AppText variant="h3" color="brandNavy" weight="bold">Filtrar por Cátedra</AppText>
                <TouchableOpacity onPress={() => setChairModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.brandNavy} />
                </TouchableOpacity>
              </View>

              {selectedChairId != null && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => handleChairSelect(null, null)}
                >
                  <Ionicons name="close-circle" size={18} color={colors.error} />
                  <AppText color="error" weight="semibold" style={{ marginLeft: 6, fontSize: 13 }}>Quitar filtro de cátedra</AppText>
                </TouchableOpacity>
              )}

              <ScrollView style={styles.chairList}>
                {chairs.map((chair) => (
                  <TouchableOpacity
                    key={chair.id}
                    style={[
                      styles.chairItem,
                      selectedChairId === chair.id && styles.chairItemSelected,
                    ]}
                    onPress={() => handleChairSelect(chair.id, chair.name)}
                  >
                    <View style={[styles.chairColorDot, { backgroundColor: chair.color || colors.brandNavy }]} />
                    <AppText
                      color={selectedChairId === chair.id ? 'white' : 'brandNavy'}
                      weight={selectedChairId === chair.id ? 'semibold' : 'regular'}
                      style={styles.chairItemText}
                    >
                      {chair.name}
                    </AppText>
                    {selectedChairId === chair.id && (
                      <Ionicons name="checkmark" size={18} color={colors.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chairList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  chairItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  chairItemSelected: {
    backgroundColor: colors.brandNavy,
  },
  chairColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  chairItemText: {
    flex: 1,
    fontSize: 15,
  },
})
