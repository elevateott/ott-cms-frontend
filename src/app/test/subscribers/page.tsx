'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { clientLogger } from '@/utils/clientLogger'
import DeviceLimitError from '@/components/auth/DeviceLimitError'
import { formatDistanceToNow } from 'date-fns'

export default function TestSubscribersPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [subscriberToken, setSubscriberToken] = useState('')
  const [subscriberId, setSubscriberId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [subscriberData, setSubscriberData] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deviceLimitReached, setDeviceLimitReached] = useState(false)

  // Check for token and device ID in localStorage on page load
  useEffect(() => {
    const storedToken = localStorage.getItem('subscriberToken')
    const storedId = localStorage.getItem('subscriberId')
    const storedDeviceId = localStorage.getItem('deviceId')

    if (storedToken) {
      setSubscriberToken(storedToken)
    }

    if (storedId) {
      setSubscriberId(storedId)
    }

    if (storedDeviceId) {
      setDeviceId(storedDeviceId)
    } else {
      // Generate a random device ID if none exists
      const newDeviceId = `test-device-${Math.random().toString(36).substring(2, 10)}`
      localStorage.setItem('deviceId', newDeviceId)
      setDeviceId(newDeviceId)
    }
  }, [])

  // Login a subscriber
  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      setDeviceLimitReached(false)

      const response = await fetch('/api/subscribers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          deviceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if this is a device limit error
        if (response.status === 403 && data.deviceLimitReached) {
          setDeviceLimitReached(true)
          throw new Error(data.message || 'Device limit reached')
        }
        throw new Error(data.error || 'Failed to login')
      }

      // Store token, ID and device ID
      localStorage.setItem('subscriberToken', data.token)
      localStorage.setItem('subscriberId', data.id)
      if (data.deviceId) {
        localStorage.setItem('deviceId', data.deviceId)
        setDeviceId(data.deviceId)
      }

      setSubscriberToken(data.token)
      setSubscriberId(data.id)
      setSuccess('Login successful')

      // Get sessions after successful login
      fetchSessions()

      clientLogger.info('Subscriber login successful', {
        id: data.id,
        email: data.email,
        deviceId: data.deviceId || deviceId,
      })
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      clientLogger.error('Subscriber login failed', { error: err })
    } finally {
      setLoading(false)
    }
  }

  // Get subscriber data
  const handleGetSubscriberData = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/subscribers/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-subscriber-token': subscriberToken,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get subscriber data')
      }

      setSubscriberData(data)
      setSuccess('Subscriber data retrieved successfully')

      clientLogger.info('Subscriber data retrieved', { id: data.id, email: data.email })
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      clientLogger.error('Failed to get subscriber data', { error: err })
    } finally {
      setLoading(false)
    }
  }

  // Check access to content
  const handleCheckAccess = async (contentId: string) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/subscribers/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberId,
          contentId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check access')
      }

      setSuccess(`Access check result: ${data.hasAccess ? 'Granted' : 'Denied'}`)

      clientLogger.info('Access check completed', {
        subscriberId,
        contentId,
        hasAccess: data.hasAccess,
      })
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      clientLogger.error('Failed to check access', { error: err })
    } finally {
      setLoading(false)
    }
  }

  // Fetch active sessions
  const fetchSessions = async () => {
    if (!subscriberToken) return

    try {
      setLoading(true)

      const response = await fetch('/api/subscribers/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-subscriber-token': subscriberToken,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions')
      }

      setSessions(data.sessions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sessions')
      clientLogger.error('Failed to fetch sessions', { error: err })
    } finally {
      setLoading(false)
    }
  }

  // Remove a session
  const handleRemoveSession = async (sessionDeviceId: string) => {
    if (!subscriberToken) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/subscribers/sessions?deviceId=${sessionDeviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-subscriber-token': subscriberToken,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove session')
      }

      setSuccess('Session removed successfully')

      // Refresh sessions
      fetchSessions()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      clientLogger.error('Failed to remove session', { error: err })
    } finally {
      setLoading(false)
    }
  }

  // Remove all sessions
  const handleRemoveAllSessions = async () => {
    if (!subscriberToken) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/subscribers/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-subscriber-token': subscriberToken,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove all sessions')
      }

      setSuccess('All sessions removed successfully')
      setSessions([])

      // Log out since we've removed our own session too
      handleLogout()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      clientLogger.error('Failed to remove all sessions', { error: err })
    } finally {
      setLoading(false)
    }
  }

  // Handle device limit error by logging out other devices
  const handleLogoutOtherDevices = async () => {
    try {
      await handleRemoveAllSessions()
      setDeviceLimitReached(false)

      // Try to login again
      await handleLogin()
    } catch (err: any) {
      setError(err.message || 'Failed to log out other devices')
      clientLogger.error('Failed to handle device limit', { error: err })
    }
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('subscriberToken')
    localStorage.removeItem('subscriberId')
    // Don't remove deviceId to simulate the same device returning
    setSubscriberToken('')
    setSubscriberId('')
    setSubscriberData(null)
    setSessions([])
    setSuccess('Logged out successfully')
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Subscriber Management Test Page</h1>

      {deviceLimitReached ? (
        <DeviceLimitError
          onLogoutOtherDevices={handleLogoutOtherDevices}
          onCancel={() => setDeviceLimitReached(false)}
        />
      ) : (
        <Tabs defaultValue="login">
          <TabsList className="mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="data">Subscriber Data</TabsTrigger>
            <TabsTrigger value="sessions">Device Sessions</TabsTrigger>
            <TabsTrigger value="access">Access Check</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Login</CardTitle>
                <CardDescription>Login with your subscriber email to get a token</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={handleLogin} disabled={loading}>
                  {loading ? 'Loading...' : 'Login'}
                </Button>
                {subscriberToken && (
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                )}
              </CardFooter>
            </Card>

            {subscriberToken && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="font-medium">Logged in successfully</p>
                <p className="text-sm mt-1">Token: {subscriberToken.substring(0, 10)}...</p>
                <p className="text-sm">ID: {subscriberId}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Data</CardTitle>
                <CardDescription>Retrieve your subscriber data using your token</CardDescription>
              </CardHeader>
              <CardContent>
                {!subscriberToken ? (
                  <p className="text-amber-600">Please login first to get a token</p>
                ) : (
                  <Button onClick={handleGetSubscriberData} disabled={loading}>
                    {loading ? 'Loading...' : 'Get My Data'}
                  </Button>
                )}

                {subscriberData && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <h3 className="font-medium mb-2">Subscriber Information</h3>
                    <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                      {JSON.stringify(subscriberData, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>Access Check</CardTitle>
                <CardDescription>Check if you have access to specific content</CardDescription>
              </CardHeader>
              <CardContent>
                {!subscriberId ? (
                  <p className="text-amber-600">Please login first</p>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contentId">Content ID</Label>
                      <Input id="contentId" placeholder="Enter content ID to check access" />
                    </div>
                    <Button
                      onClick={() => {
                        const contentId = (document.getElementById('contentId') as HTMLInputElement)
                          .value
                        handleCheckAccess(contentId)
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Checking...' : 'Check Access'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Device Sessions</CardTitle>
                <CardDescription>Manage your active device sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {!subscriberToken ? (
                  <p className="text-amber-600">Please login first to view your sessions</p>
                ) : (
                  <>
                    <div className="flex justify-between mb-4">
                      <Button onClick={fetchSessions} variant="outline" disabled={loading}>
                        {loading ? 'Loading...' : 'Refresh Sessions'}
                      </Button>

                      <Button
                        onClick={handleRemoveAllSessions}
                        variant="destructive"
                        disabled={loading || sessions.length === 0}
                      >
                        Log Out All Devices
                      </Button>
                    </div>

                    {sessions.length === 0 ? (
                      <p className="text-muted-foreground">No active sessions found</p>
                    ) : (
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
                                {session.deviceId === deviceId ? (
                                  <span className="font-bold">
                                    {session.deviceId.substring(0, 12)}... (This Device)
                                  </span>
                                ) : (
                                  session.deviceId.substring(0, 12) + '...'
                                )}
                              </TableCell>
                              <TableCell>{session.ip || 'Unknown'}</TableCell>
                              <TableCell>
                                {session.userAgent
                                  ? session.userAgent.substring(0, 30) + '...'
                                  : 'Unknown'}
                              </TableCell>
                              <TableCell>
                                {session.lastActive
                                  ? formatDistanceToNow(new Date(session.lastActive)) + ' ago'
                                  : 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveSession(session.deviceId)}
                                  disabled={loading}
                                >
                                  Log Out
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{success}</p>
        </div>
      )}
    </div>
  )
}
