'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useField } from '@payloadcms/ui'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

const ActiveSessionsField: React.FC = () => {
  const { value, setValue } = useField<any[]>({ path: 'activeSessions' })
  const { id } = useDocumentInfo()
  const { toast } = useToast()
  
  const sessions = value || []
  
  // Format the user agent to show browser and OS
  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return 'Unknown'
    
    // Truncate if too long
    if (userAgent.length > 50) {
      return `${userAgent.substring(0, 47)}...`
    }
    
    return userAgent
  }
  
  // Format the last active time
  const formatLastActive = (lastActive: string) => {
    if (!lastActive) return 'Unknown'
    
    try {
      return `${formatDistanceToNow(new Date(lastActive))} ago`
    } catch (error) {
      return 'Invalid date'
    }
  }
  
  // Handle removing a session
  const handleRemoveSession = async (deviceId: string) => {
    try {
      // Filter out the session with the matching device ID
      const updatedSessions = sessions.filter((session) => session.deviceId !== deviceId)
      
      // Update the field value
      setValue(updatedSessions)
      
      toast({
        title: 'Session removed',
        description: 'The device has been logged out successfully.',
      })
      
      clientLogger.info('Admin removed subscriber session', { subscriberId: id, deviceId })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove the session. Please try again.',
        variant: 'destructive',
      })
      
      clientLogger.error('Error removing subscriber session', { error, subscriberId: id, deviceId })
    }
  }
  
  // Handle removing all sessions
  const handleRemoveAllSessions = () => {
    try {
      // Clear all sessions
      setValue([])
      
      toast({
        title: 'All sessions removed',
        description: 'All devices have been logged out successfully.',
      })
      
      clientLogger.info('Admin removed all subscriber sessions', { subscriberId: id })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove all sessions. Please try again.',
        variant: 'destructive',
      })
      
      clientLogger.error('Error removing all subscriber sessions', { error, subscriberId: id })
    }
  }
  
  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>No active sessions found for this subscriber.</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions ({sessions.length})</CardTitle>
        <CardDescription>
          These are the devices currently logged in as this subscriber.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Browser / Device</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.deviceId}>
                <TableCell className="font-mono text-xs">
                  {session.deviceId.substring(0, 12)}...
                </TableCell>
                <TableCell>{session.ip || 'Unknown'}</TableCell>
                <TableCell>{formatUserAgent(session.userAgent)}</TableCell>
                <TableCell>{formatLastActive(session.lastActive)}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveSession(session.deviceId)}
                  >
                    Log Out
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={handleRemoveAllSessions}>
          Log Out All Devices
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ActiveSessionsField
