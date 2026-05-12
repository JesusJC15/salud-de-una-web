import type { EntityId, IsoDateString } from './common'

export interface ListNotificationsDto {
  unreadOnly?: boolean
  limit?: number
}

export interface Notification {
  id?: EntityId
  userId?: EntityId
  type: string
  status: string
  message: string
  read: boolean
  readAt?: IsoDateString | null
  createdAt?: IsoDateString | null
  updatedAt?: IsoDateString | null
}

export interface NotificationListItem {
  id: EntityId
  type: string
  status: string
  message: string
  resourceId?: EntityId | null
  deepLink?: string | null
  metadata?: Record<string, unknown> | null
  read: boolean
  readAt: IsoDateString | null
  createdAt: IsoDateString | null
}

export interface NotificationsResponseDto {
  items: NotificationListItem[]
  unreadCount: number
}

export interface MarkNotificationAsReadResponseDto {
  id: EntityId
  read: boolean
  readAt: IsoDateString | null
}

export interface MarkAllNotificationsAsReadResponseDto {
  updatedCount: number
  readAt: IsoDateString
}
