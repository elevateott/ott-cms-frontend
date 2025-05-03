'use client'

import { format } from 'date-fns'
import type { DefaultCellComponentProps } from 'payload'

const FormattedDateCell = ({ cellData }: DefaultCellComponentProps) => {
  if (!cellData) return null

  const formattedDate = format(new Date(cellData), 'MM/dd/yy h:mm a') // "04/24/25 10:54 am"

  return <span>{formattedDate}</span>
}

export default FormattedDateCell
