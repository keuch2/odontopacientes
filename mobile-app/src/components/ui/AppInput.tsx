import React from 'react'
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'

interface AppInputProps extends TextInputProps {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  icon,
  style,
  secureTextEntry,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          textContentType={secureTextEntry ? 'oneTimeCode' : undefined}
          autoComplete={secureTextEntry ? 'off' : undefined}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: spacing.xs,
  },
})
