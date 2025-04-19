// src/collections/Videos/components/VideoStats.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const VideoStats = () => {
  const { id } = useDocumentInfo()
  const [stats, setStats] = useState<{
    views: { total: number; daily: { date: string; views: number }[] }
    engagement: { averageWatchTime: number; completionRate: number }
    loading: boolean
    error: string | null
  }>({
    views: {
      total: 0,
      daily: [],
    },
    engagement: {
      averageWatchTime: 0,
      completionRate: 0,
    },
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/videos/${id}/stats`)

        if (!response.ok) {
          throw new Error('Failed to fetch video statistics')
        }

        const data = await response.json()
        setStats({
          ...data,
          loading: false,
          error: null,
        })
      } catch (error) {
        setStats(
          (prevState) =>
            ({
              ...prevState,
              loading: false,
              error: error instanceof Error ? error.message : String(error),
            }) as {
              views: typeof prevState.views
              engagement: typeof prevState.engagement
              loading: boolean
              error: string | null
            },
        )
      }
    }

    if (id) {
      fetchStats()
    }
  }, [id])

  if (stats.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Video Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stats.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Video Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-600 rounded-md">{stats.error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</h3>
            <p className="text-2xl font-bold">{stats.views.total.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Avg. Watch Time
            </h3>
            <p className="text-2xl font-bold">{stats.engagement.averageWatchTime.toFixed(2)}s</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Completion Rate
            </h3>
            <p className="text-2xl font-bold">
              {(stats.engagement.completionRate * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="h-64">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Views (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.views.daily}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default VideoStats
