import React from 'react'
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native'
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

interface ToothPickerModalProps {
  visible: boolean
  onClose: () => void
  selectedTooth: string | null
  onToothChange: (tooth: string | null) => void
}

export function ToothPickerModal({ visible, onClose, selectedTooth, onToothChange }: ToothPickerModalProps) {
  const handleToothSelect = (tooth: number | null) => {
    onToothChange(tooth ? tooth.toString() : null)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <AppText variant="h3" color="brandNavy" weight="bold">Filtrar por Diente</AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.brandNavy} />
            </TouchableOpacity>
          </View>

          {selectedTooth && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleToothSelect(null)}
            >
              <Ionicons name="close-circle" size={18} color={colors.error} />
              <AppText color="error" weight="semibold" style={{ marginLeft: 6, fontSize: 13 }}>Quitar filtro de diente</AppText>
            </TouchableOpacity>
          )}

          <AppText color="textMuted" style={{ marginBottom: 8, paddingHorizontal: spacing.lg, fontSize: 13 }}>Arcada Superior</AppText>
          <View style={styles.grid}>
            {ALL_TEETH.slice(0, 16).map((tooth) => (
              <TouchableOpacity
                key={tooth}
                style={[styles.item, selectedTooth === tooth.toString() && styles.itemActive]}
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
          <View style={styles.grid}>
            {ALL_TEETH.slice(16).map((tooth) => (
              <TouchableOpacity
                key={tooth}
                style={[styles.item, selectedTooth === tooth.toString() && styles.itemActive]}
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
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
  },
  header: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  item: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  itemActive: {
    backgroundColor: colors.brandTurquoise,
    borderColor: colors.brandTurquoise,
  },
})
