'use client'

import type { CustomComponent } from 'payload'
import type { UIFieldProps } from '@/types/UIFieldProps'

const SimpleNotice: CustomComponent<UIFieldProps> = (_props: UIFieldProps) => {
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
