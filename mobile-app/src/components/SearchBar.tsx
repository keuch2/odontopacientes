import React, { useState } from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { AppText } from './ui'

const ALL_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void
  showToothFilter?: boolean
  selectedTooth?: string | null
  onToothChange?: (tooth: string | null) => void
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
}: SearchBarProps) {
  const [toothModalVisible, setToothModalVisible] = useState(false)

  const handleToothSelect = (tooth: number | null) => {
    onToothChange?.(tooth ? tooth.toString() : null)
    setToothModalVisible(false)
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
        {showToothFilter && (
          <TouchableOpacity
            style={[
              styles.toothFilterButton,
              selectedTooth && styles.toothFilterButtonActive,
            ]}
            onPress={() => setToothModalVisible(true)}
          >
            <Ionicons name="medical" size={16} color={selectedTooth ? colors.white : colors.brandNavy} />
            <AppText
              color={selectedTooth ? 'white' : 'brandNavy'}
              style={{ fontSize: 12, marginLeft: 4 }}
              weight="semibold"
            >
              {selectedTooth ? `#${selectedTooth}` : 'Diente'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {showToothFilter && (
        <Modal
          visible={toothModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setToothModalVisible(false)}
        >
          <View style={styles.toothModalOverlay}>
            <View style={styles.toothModalContent}>
              <View style={styles.toothModalHeader}>
                <AppText variant="h3" color="brandNavy" weight="bold">Filtrar por Diente</AppText>
                <TouchableOpacity onPress={() => setToothModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.brandNavy} />
                </TouchableOpacity>
              </View>

              {selectedTooth && (
                <TouchableOpacity
                  style={styles.clearToothButton}
                  onPress={() => handleToothSelect(null)}
                >
                  <Ionicons name="close-circle" size={18} color={colors.error} />
                  <AppText color="error" weight="semibold" style={{ marginLeft: 6, fontSize: 13 }}>Quitar filtro de diente</AppText>
                </TouchableOpacity>
              )}

              <AppText color="textMuted" style={{ marginBottom: 8, paddingHorizontal: spacing.lg, fontSize: 13 }}>Arcada Superior</AppText>
              <View style={styles.toothGrid}>
                {ALL_TEETH.slice(0, 16).map((tooth) => (
                  <TouchableOpacity
                    key={tooth}
                    style={[
                      styles.toothItem,
                      selectedTooth === tooth.toString() && styles.toothItemActive,
                    ]}
                    onPress={() => handleToothSelect(tooth)}
                  >
                    <AppText
                      color={selectedTooth === tooth.toString() ? 'white' : 'brandNavy'}
                      weight="bold"
                      style={{ fontSize: 13 }}
                    >
                      {tooth}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <AppText color="textMuted" style={{ marginBottom: 8, marginTop: spacing.md, paddingHorizontal: spacing.lg, fontSize: 13 }}>Arcada Inferior</AppText>
              <View style={styles.toothGrid}>
                {ALL_TEETH.slice(16).map((tooth) => (
                  <TouchableOpacity
                    key={tooth}
                    style={[
                      styles.toothItem,
                      selectedTooth === tooth.toString() && styles.toothItemActive,
                    ]}
                    onPress={() => handleToothSelect(tooth)}
                  >
                    <AppText
                      color={selectedTooth === tooth.toString() ? 'white' : 'brandNavy'}
                      weight="bold"
                      style={{ fontSize: 13 }}
                    >
                      {tooth}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
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
  toothFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brandNavy,
    marginLeft: spacing.sm,
  },
  toothFilterButtonActive: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  toothModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  toothModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
  },
  toothModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clearToothButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toothGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  toothItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  toothItemActive: {
    backgroundColor: colors.brandTurquoise,
    borderColor: colors.brandTurquoise,
  },
})
