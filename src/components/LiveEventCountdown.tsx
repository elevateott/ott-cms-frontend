'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, AlertCircle } from 'lucide-react'

type CountdownProps = {
  startTime: string
  endTime?: string
  className?: string
}

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const LiveEventCountdown: React.FC<CountdownProps> = ({
  startTime,
  endTime,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [eventStatus, setEventStatus] = useState<'upcoming' | 'live' | 'ended'>('upcoming')
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const start = new Date(startTime)
      const end = endTime ? new Date(endTime) : null
      
      // Check event status
      if (end && now > end) {
        setEventStatus('ended')
        setTimeLeft(null)
        return
      }
      
      if (now > start) {
        setEventStatus('live')
        setTimeLeft(null)
        return
      }
      
      setEventStatus('upcoming')
      
      // Calculate time left until start
      const difference = start.getTime() - now.getTime()
      
      if (difference <= 0) {
        setTimeLeft(null)
        return
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)
      
      setTimeLeft({ days, hours, minutes, seconds })
    }
    
    // Calculate immediately
    calculateTimeLeft()
    
    // Set up interval to update countdown
    const timer = setInterval(calculateTimeLeft, 1000)
    
    // Clean up interval on unmount
    return () => clearInterval(timer)
  }, [startTime, endTime])
  
  const renderTimeUnit = (value: number, label: string) => (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
  
  const renderStatusBadge = () => {
    switch (eventStatus) {
      case 'live':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
            Live Now
          </Badge>
        )
      case 'ended':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Event Ended
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Calendar className="h-3 w-3 mr-1" />
            Upcoming
          </Badge>
        )
    }
  }
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium">Event Countdown</span>
          </div>
          {renderStatusBadge()}
        </div>
        
        {eventStatus === 'upcoming' && timeLeft ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            {renderTimeUnit(timeLeft.days, 'Days')}
            {renderTimeUnit(timeLeft.hours, 'Hours')}
            {renderTimeUnit(timeLeft.minutes, 'Minutes')}
            {renderTimeUnit(timeLeft.seconds, 'Seconds')}
          </div>
        ) : eventStatus === 'live' ? (
          <div className="text-center py-2">
            <p className="text-lg font-semibold text-red-600">This event is live now!</p>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-lg font-semibold text-gray-600">This event has ended</p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          {eventStatus === 'upcoming' ? (
            <>Starts {new Date(startTime).toLocaleString()}</>
          ) : eventStatus === 'live' && endTime ? (
            <>Ends {new Date(endTime).toLocaleString()}</>
          ) : (
            <>Event ended {endTime ? new Date(endTime).toLocaleString() : ''}</>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default LiveEventCountdown
