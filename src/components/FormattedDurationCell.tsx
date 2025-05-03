'use client'

import type { DefaultCellComponentProps } from 'payload'

/**
 * Format a duration in seconds to a human-readable string
 * Examples: 1h 2m 45s, 5m 10s, 43s
 */
const formatDuration = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '—'
  
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  
  return parts.join(' ')
}

/**
 * Cell component for formatting duration values in seconds
 */
const FormattedDurationCell = ({ cellData }: DefaultCellComponentProps) => {
  if (cellData === null || cellData === undefined || typeof cellData !== 'number') {
    return <span>—</span>
  }
  
  const formatted = formatDuration(cellData)
  return <span>{formatted}</span>
}

export default FormattedDurationCell
