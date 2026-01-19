import React from 'react'
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { AppText, AppCard } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

interface Notification {
  id: number
  type: string
  message: string
  created_at: string
  user: {
    name: string
  }
  read_at?: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'assignment':
      return { name: 'person-add' as const, color: colors.brandTurquoise }
    case 'procedure_completed':
      return { name: 'checkmark-circle' as const, color: colors.success }
    case 'patient_registered':
      return { name: 'person' as const, color: colors.brandNavy }
    case 'consent_signed':
      return { name: 'document-text' as const, color: colors.warning }
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
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list({ per_page: 20 }),
  })

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type)
    
    return (
      <TouchableOpacity
        style={styles.notificationCard}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        
        <View style={styles.notificationContent}>
          <AppText variant="body" weight="semibold" color="brandNavy" style={styles.message}>
            {item.message}
          </AppText>
          <View style={styles.metaRow}>
            <AppText variant="caption" color="textMuted">
              {item.user.name}
            </AppText>
            <AppText variant="caption" color="textMuted">
              • {formatTimeAgo(item.created_at)}
            </AppText>
          </View>
        </View>
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
        <AppText variant="h2" color="brandNavy" weight="bold">
          Notificaciones
        </AppText>
        {data?.data.data && data.data.data.length > 0 && (
          <AppText variant="caption" color="textMuted">
            {data.data.data.length} notificaciones
          </AppText>
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
          data={data?.data.data || []}
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
})
