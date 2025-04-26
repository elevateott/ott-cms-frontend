'use client'

import { PayloadComponent } from 'payload'

type UIFieldProps = {
  path: string
  field: {
    name: string
    label?: string
    admin?: {
      description?: string
    }
  }
  value?: unknown
  onChange?: (value: unknown) => void
  preferencesKey?: string
  operation?: 'create' | 'update'
  user?: {
    id: string
    email?: string
    roles?: string[]
  }
}

export const SimpleNotice: PayloadComponent<never, UIFieldProps> = (_props) => {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '1rem',
      }}
    >
      <strong>Note:</strong> Please make sure to fill out the Site Name field!
    </div>
  )
}

export default SimpleNotice
