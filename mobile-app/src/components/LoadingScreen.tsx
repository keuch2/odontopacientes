import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ActivityIndicator, Text } from 'react-native-paper'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        animating={true} 
        size="large" 
        style={styles.indicator}
      />
      <Text variant="bodyLarge" style={styles.message}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  indicator: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    color: '#64748b',
  },
})
