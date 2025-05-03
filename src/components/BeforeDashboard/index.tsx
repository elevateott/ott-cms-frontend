import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import LiveStreamingDashboard from '@/components/dashboard/LiveStreamingDashboard'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>OTT Platform Dashboard</h4>
      </Banner>

      <div className="mt-6">
        <LiveStreamingDashboard />
      </div>
    </div>
  )
}

export default BeforeDashboard
