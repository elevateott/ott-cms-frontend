'use client'

import React, { useState } from 'react'

interface SimpleTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-1',
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm ${positionClasses[position]}`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'top-full -translate-x-1/2 -mt-1 left-1/2' :
              position === 'bottom' ? 'bottom-full -translate-x-1/2 -mb-1 left-1/2' :
              position === 'left' ? 'left-full -translate-y-1/2 -ml-1 top-1/2' :
              'right-full -translate-y-1/2 -mr-1 top-1/2'
            }`}
          />
        </div>
      )}
    </div>
  )
}

export default SimpleTooltip
