import React from 'react'
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { AppText, AppCard } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface Notification {
  id: number
  type: string
  title: string
  body: string
  data?: any
  priority: string
  created_at: string
  read_at?: string | null
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'assignment':
      return { name: 'person-add' as const, color: colors.brandTurquoise }
    case 'procedure_completed':
      return { name: 'checkmark-circle' as const, color: colors.success }
    case 'patient_created':
      return { name: 'person' as const, color: colors.brandNavy }
    case 'procedure_created':
      return { name: 'medkit' as const, color: colors.warning }
    default:
      return { name: 'notifications' as const, color: colors.textSecondary }
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })
}

export default function NotificationsScreen() {
  const navigation = useNavigation()
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list({ per_page: 20 }),
  })

  const notifications: Notification[] = data?.data?.data || []

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.notifications.markAsRead(id)
      refetch()
    } catch (e) {
      // silent
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead()
      refetch()
    } catch (e) {
      // silent
    }
  }

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type)
    const isUnread = !item.read_at
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.notificationUnread]}
        activeOpacity={0.7}
        onPress={() => isUnread && handleMarkAsRead(item.id)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        
        <View style={styles.notificationContent}>
          <AppText variant="body" weight={isUnread ? 'bold' : 'normal'} color="brandNavy" style={styles.message}>
            {item.title}
          </AppText>
          <AppText variant="caption" color="textSecondary" style={styles.body}>
            {item.body}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {formatTimeAgo(item.created_at)}
          </AppText>
        </View>

        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
      <AppText variant="body" color="textMuted" align="center" style={styles.emptyText}>
        No tienes notificaciones pendientes
      </AppText>
    </View>
  )

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
      <AppText variant="body" color="textMuted" align="center" style={styles.emptyText}>
        Error al cargar notificaciones
      </AppText>
      <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
        <AppText color="brandTurquoise" weight="semibold">
          Reintentar
        </AppText>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Notificaciones
          </AppText>
          <TouchableOpacity
            style={styles.prefsButton}
            onPress={() => (navigation as any).navigate('NotificationPreferences')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.brandNavy} />
          </TouchableOpacity>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <AppText variant="caption" color="brandTurquoise" weight="semibold">
              Marcar todas como leídas
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandTurquoise} />
          <AppText color="textMuted" style={styles.loadingText}>
            Cargando notificaciones...
          </AppText>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brandTurquoise}
              colors={[colors.brandTurquoise]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefsButton: {
    padding: spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  notificationUnread: {
    backgroundColor: '#F0F9FF',
  },
  body: {
    marginBottom: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandTurquoise,
    alignSelf: 'center',
    marginLeft: spacing.sm,
  },
})
