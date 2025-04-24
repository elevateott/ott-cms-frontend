'use client'

import { format } from 'date-fns'
import type { DefaultCellComponentProps } from 'payload'

const FormattedDateCell = ({ cellData }: DefaultCellComponentProps) => {
  if (!cellData) return null

  const formattedDate = format(new Date(cellData), 'MMMM do yyyy, h:mm a') // "April 14th 2025"

  return <span>{formattedDate}</span>
}

export default FormattedDateCell
