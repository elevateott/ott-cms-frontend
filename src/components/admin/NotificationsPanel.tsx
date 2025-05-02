'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEventBusOn } from '@/hooks/useEventBus'
import { eventBus } from '@/utilities/eventBus'
import { EVENTS } from '@/constants/events'
import { AlertCircle, Bell, CheckCircle, Info, X } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  relatedLiveEvent?: {
    id: string
    title: string
  }
  createdAt: string
}

/**
 * NotificationsPanel
 *
 * A component to display system notifications in the admin dashboard
 */
const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<boolean>(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const router = useRouter()

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=10&sort=-createdAt')

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.docs || [])

      // Count unread notifications
      const unread = (data.docs || []).filter((n: Notification) => !n.read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          read: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Get all unread notification IDs
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)

      if (unreadIds.length === 0) {
        return
      }

      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: unreadIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

      // Update unread count
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Navigate to related live event
  const navigateToLiveEvent = (id: string) => {
    router.push(`/admin/collections/live-events/${id}`)
  }

  // Listen for new notifications
  useEventBusOn(
    EVENTS.NOTIFICATION,
    () => {
      fetchNotifications()
    },
    [],
  )

  // Initial fetch
  useEffect(() => {
    fetchNotifications()

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000) // Every 30 seconds

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Get icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <X className="h-5 w-5 text-red-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {expanded && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  aria-label="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading notifications...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">{notification.message}</div>
                        <div className="mt-2 text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                        <div className="mt-2 flex space-x-2">
                          {notification.relatedLiveEvent && (
                            <button
                              onClick={() => navigateToLiveEvent(notification.relatedLiveEvent.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View Live Event
                            </button>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-gray-600 hover:text-gray-800"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 text-center">
            <button
              onClick={() => router.push('/admin/collections/notifications')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel
