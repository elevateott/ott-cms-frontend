'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, Mail, RefreshCw, UserCheck } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { formatDistanceToNow } from 'date-fns'

const logger = clientLogger.createContextLogger('RegistrationsPanel')

type Registration = {
  id: string
  firstName: string
  lastName: string
  email: string
  confirmed: boolean
  reminderSent: boolean
  createdAt: string
}

export const RegistrationsPanel: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    reminderSent: 0,
  })
  const { id } = useDocumentInfo()
  const { toast } = useToast()

  // Fetch registrations for this live event
  const fetchRegistrations = async () => {
    if (!id) return
    
    try {
      setIsLoading(true)
      
      // Fetch registrations from the API
      const response = await fetch(`/api/live-event-registrations?liveEvent=${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch registrations')
      }
      
      const data = await response.json()
      setRegistrations(data.docs || [])
      
      // Calculate stats
      const total = data.docs?.length || 0
      const confirmed = data.docs?.filter((reg: Registration) => reg.confirmed)?.length || 0
      const reminderSent = data.docs?.filter((reg: Registration) => reg.reminderSent)?.length || 0
      
      setStats({ total, confirmed, reminderSent })
    } catch (error) {
      logger.error('Failed to fetch registrations', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch registrations',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch registrations on component mount
  useEffect(() => {
    fetchRegistrations()
  }, [id])
  
  // Handle export to CSV
  const handleExportCSV = async () => {
    if (!id || registrations.length === 0) return
    
    try {
      const csvContent = [
        // CSV header
        ['First Name', 'Last Name', 'Email', 'Confirmed', 'Reminder Sent', 'Registered At'].join(','),
        // CSV rows
        ...registrations.map(reg => [
          reg.firstName,
          reg.lastName,
          reg.email,
          reg.confirmed ? 'Yes' : 'No',
          reg.reminderSent ? 'Yes' : 'No',
          new Date(reg.createdAt).toLocaleString()
        ].join(','))
      ].join('\n')
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `registrations-${id}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'Success',
        description: 'Registrations exported to CSV',
      })
    } catch (error) {
      logger.error('Failed to export registrations', error)
      toast({
        title: 'Error',
        description: 'Failed to export registrations',
        variant: 'destructive',
      })
    }
  }
  
  // Handle sending test reminder email
  const handleSendTestReminder = async () => {
    if (!id) return
    
    try {
      const response = await fetch(`/api/live-events/${id}/send-test-reminder`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send test reminder')
      }
      
      toast({
        title: 'Success',
        description: 'Test reminder email sent',
      })
    } catch (error) {
      logger.error('Failed to send test reminder', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test reminder',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Registrations</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRegistrations}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              disabled={isLoading || registrations.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendTestReminder}
              disabled={isLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              Test Reminder
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Manage user registrations for this live event
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-500">Total Registrations</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-500">Confirmed</div>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-500">Reminders Sent</div>
            <div className="text-2xl font-bold">{stats.reminderSent}</div>
          </div>
        </div>
        
        {/* Registrations list */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : registrations.length === 0 ? (
          <Alert>
            <AlertDescription>
              No registrations found for this event.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 font-medium text-sm">
              <div className="col-span-3">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Registered</div>
            </div>
            <Separator />
            {registrations.map((registration, index) => (
              <React.Fragment key={registration.id}>
                {index > 0 && <Separator />}
                <div className="grid grid-cols-12 gap-2 p-3 text-sm">
                  <div className="col-span-3">{registration.firstName} {registration.lastName}</div>
                  <div className="col-span-4 truncate">{registration.email}</div>
                  <div className="col-span-2">
                    {registration.confirmed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Confirmed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-3 text-gray-500">
                    {formatDistanceToNow(new Date(registration.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RegistrationsPanel
