'use client'

import React from 'react'
import UpcomingStreamsWidget from './UpcomingStreamsWidget'
import StreamsInProgressWidget from './StreamsInProgressWidget'
import RecentRecordingsWidget from './RecentRecordingsWidget'

const LiveStreamingDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Live Streaming Command Center</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StreamsInProgressWidget />
        <UpcomingStreamsWidget />
        <RecentRecordingsWidget />
      </div>
    </div>
  )
}

export default LiveStreamingDashboard
