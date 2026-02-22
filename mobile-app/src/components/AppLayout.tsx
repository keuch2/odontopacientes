import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { AppHeader } from './AppHeader'
import { SideMenu } from './SideMenu'

interface AppLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
}

export function AppLayout({ children, showHeader = true }: AppLayoutProps) {
  const [menuVisible, setMenuVisible] = useState(false)

  const handleMenuPress = () => {
    setMenuVisible(true)
  }

  const handleMenuClose = () => {
    setMenuVisible(false)
  }

  return (
    <View style={styles.container}>
      <SideMenu visible={menuVisible} onClose={handleMenuClose} />
      {showHeader && <AppHeader onMenuPress={handleMenuPress} />}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
