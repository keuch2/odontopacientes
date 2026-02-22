import React from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { AppText } from './ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

export type ToothStatus = 'healthy' | 'caries' | 'filled' | 'missing' | 'crown' | 'root_canal' | 'extracted'

export interface ToothData {
  number: number
  status: ToothStatus
  notes?: string
}

interface OdontogramProps {
  teeth: ToothData[]
  onToothPress?: (toothNumber: number) => void
  editable?: boolean
}

const getStatusColor = (status: ToothStatus): string => {
  switch (status) {
    case 'healthy':
      return colors.white
    case 'caries':
      return '#FF6B6B'
    case 'filled':
      return '#4ECDC4'
    case 'missing':
      return '#6B7280'
    case 'crown':
      return '#F39C12'
    case 'root_canal':
      return '#9B59B6'
    case 'extracted':
      return '#34495E'
    default:
      return colors.white
  }
}

const getStatusLabel = (status: ToothStatus): string => {
  switch (status) {
    case 'healthy':
      return 'Sano'
    case 'caries':
      return 'Caries'
    case 'filled':
      return 'Obturado'
    case 'missing':
      return 'Ausente'
    case 'crown':
      return 'Corona'
    case 'root_canal':
      return 'Endodoncia'
    case 'extracted':
      return 'Extraído'
    default:
      return 'Desconocido'
  }
}

export default function Odontogram({ teeth, onToothPress, editable = false }: OdontogramProps) {
  const getToothStatus = (toothNumber: number): ToothStatus => {
    const tooth = teeth.find(t => t.number === toothNumber)
    return tooth?.status || 'healthy'
  }

  const renderTooth = (toothNumber: number) => {
    const status = getToothStatus(toothNumber)
    const backgroundColor = getStatusColor(status)
    const isExtracted = status === 'extracted'
    const isMissing = status === 'missing'

    return (
      <TouchableOpacity
        key={toothNumber}
        style={[
          styles.tooth,
          { backgroundColor },
          isExtracted && styles.toothExtracted,
          isMissing && styles.toothMissing,
        ]}
        onPress={() => editable && onToothPress?.(toothNumber)}
        disabled={!editable}
      >
        {isMissing && (
          <View style={styles.missingOverlay}>
            <View style={styles.missingLineLeft} />
            <View style={styles.missingLineRight} />
          </View>
        )}
        <AppText
          style={[
            styles.toothNumber,
            status !== 'healthy' && styles.toothNumberLight,
            isExtracted && styles.toothNumberExtracted,
            isMissing && styles.toothNumberMissing,
          ]}
        >
          {toothNumber}
        </AppText>
      </TouchableOpacity>
    )
  }

  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41]
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38]

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.odontogramContainer}>
          <View style={styles.upperJaw}>
            <View style={styles.quadrant}>
              <AppText style={styles.quadrantLabel}>Cuadrante 1</AppText>
              <View style={styles.teethRow}>
                {upperRight.map(renderTooth)}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.quadrant}>
              <AppText style={styles.quadrantLabel}>Cuadrante 2</AppText>
              <View style={styles.teethRow}>
                {upperLeft.map(renderTooth)}
              </View>
            </View>
          </View>

          <View style={styles.jawSeparator} />

          <View style={styles.lowerJaw}>
            <View style={styles.quadrant}>
              <AppText style={styles.quadrantLabel}>Cuadrante 4</AppText>
              <View style={styles.teethRow}>
                {lowerRight.map(renderTooth)}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.quadrant}>
              <AppText style={styles.quadrantLabel}>Cuadrante 3</AppText>
              <View style={styles.teethRow}>
                {lowerLeft.map(renderTooth)}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <AppText variant="body" weight="semibold" style={styles.legendTitle}>
          Leyenda:
        </AppText>
        <View style={styles.legendGrid}>
          {(['healthy', 'caries', 'filled', 'missing', 'crown', 'root_canal', 'extracted'] as ToothStatus[]).map(status => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getStatusColor(status) }]} />
              <AppText style={styles.legendText}>{getStatusLabel(status)}</AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  odontogramContainer: {
    minWidth: 700,
  },
  upperJaw: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  lowerJaw: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  quadrant: {
    alignItems: 'center',
  },
  quadrantLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  teethRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tooth: {
    width: 40,
    height: 50,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  toothExtracted: {
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  toothMissing: {
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
  },
  missingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingLineLeft: {
    position: 'absolute',
    width: 2,
    height: '80%',
    backgroundColor: '#EF4444',
    transform: [{ rotate: '45deg' }],
  },
  missingLineRight: {
    position: 'absolute',
    width: 2,
    height: '80%',
    backgroundColor: '#EF4444',
    transform: [{ rotate: '-45deg' }],
  },
  toothNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  toothNumberLight: {
    color: colors.white,
  },
  toothNumberExtracted: {
    color: colors.textMuted,
  },
  toothNumberMissing: {
    color: colors.white,
    zIndex: 1,
  },
  divider: {
    width: 2,
    height: 50,
    backgroundColor: colors.brandNavy,
    marginHorizontal: spacing.sm,
  },
  jawSeparator: {
    height: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginVertical: spacing.sm,
  },
  legend: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendTitle: {
    marginBottom: spacing.sm,
    color: colors.brandNavy,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.brandNavy,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
})
