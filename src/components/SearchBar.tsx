import React from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void
}

export function SearchBar({ 
  placeholder = 'Buscar materias, pacientes, procedimientos, etc',
  value,
  onChangeText,
  onFocus,
  onBlur
}: SearchBarProps) {
  return (
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
    </View>
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
})
