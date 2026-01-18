import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { AppText } from './ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index
        const isAddButton = route.name === 'Add'

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          })
        }

        // Renderizar botón central de agregar
        if (isAddButton) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.addButtonContainer}
            >
              <View style={styles.addButton}>
                <Ionicons name="add" size={32} color={colors.white} />
              </View>
            </TouchableOpacity>
          )
        }

        // Renderizar íconos normales
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            {renderIcon(route.name, isFocused)}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function renderIcon(routeName: string, isFocused: boolean) {
  const iconColor = colors.brandNavy
  const iconSize = 32

  let iconName: keyof typeof Ionicons.glyphMap = 'home'

  switch (routeName) {
    case 'Catedras':
      iconName = 'home'
      break
    case 'Dashboard':
      iconName = 'person'
      break
    case 'MyPatients':
      iconName = 'people'
      break
    case 'Notifications':
      iconName = 'notifications'
      break
    case 'Settings':
      iconName = 'settings'
      break
    default:
      iconName = 'ellipse'
  }

  return <Ionicons name={iconName} size={iconSize} color={iconColor} />
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 70,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  addButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.brandTurquoise,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
