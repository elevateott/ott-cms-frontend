'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

interface DeviceLimitErrorProps {
  onLogoutOtherDevices?: () => Promise<void>
  onCancel?: () => void
}

/**
 * Component to display when a user has reached their device limit
 */
const DeviceLimitError: React.FC<DeviceLimitErrorProps> = ({ 
  onLogoutOtherDevices,
  onCancel
}) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()
  
  const handleLogoutOtherDevices = async () => {
    if (!onLogoutOtherDevices) return
    
    try {
      setIsLoading(true)
      await onLogoutOtherDevices()
      
      toast({
        title: 'Success',
        description: 'Other devices have been logged out. You can now log in.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out other devices. Please try again.',
        variant: 'destructive',
      })
      
      clientLogger.error('Error logging out other devices', { error })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Device Limit Reached</CardTitle>
        <CardDescription>
          You've reached your maximum number of devices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Your subscription allows a limited number of devices to be logged in at the same time.
          To continue on this device, you'll need to log out from one of your other devices.
        </p>
        
        {onLogoutOtherDevices && (
          <p className="text-sm font-medium">
            You can log out from all other devices by clicking the button below.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        {onLogoutOtherDevices && (
          <Button onClick={handleLogoutOtherDevices} disabled={isLoading}>
            {isLoading ? 'Logging out...' : 'Log Out Other Devices'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default DeviceLimitError
