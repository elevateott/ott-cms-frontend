'use client'

import { useField } from '@payloadcms/ui'
import type { TextareaFieldClientComponent } from 'payload'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'

const SecureTextareaField: TextareaFieldClientComponent = (props) => {
  const { path, field } = props
  const { label, required, admin } = field
  const { description } = admin || {}

  const { value, setValue } = useField<string>({ path })
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible((prev) => !prev)

  const getLabelText = () => {
    if (typeof label === 'string') return label
    if (typeof label === 'object' && label !== null) {
      return label['en'] || Object.values(label)[0] || ''
    }
    return ''
  }

  const getDescriptionText = () => {
    if (typeof description === 'string') return description
    if (typeof description === 'object' && description !== null) {
      return description['en'] || Object.values(description)[0] || ''
    }
    return ''
  }

  const renderMaskedValue = (val: string | undefined) => {
    if (!val) return ''
    return val
      .split('')
      .map((char) => (char === '\n' ? '\n' : '•'))
      .join('')
  }

  return (
    <div className="mb-6">
      {label && (
        <label className="block mb-1 font-semibold">
          {getLabelText()} {required && '*'}
        </label>
      )}

      {description && <p className="text-sm text-gray-500 mb-2">{getDescriptionText()}</p>}

      <div className="flex justify-end mb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleVisibility}
          className="p-1"
        >
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>
      </div>

      <textarea
        value={isVisible ? value || '' : renderMaskedValue(value)}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-y min-h-[120px] font-mono tracking-widest"
        style={{
          letterSpacing: isVisible ? 'normal' : '0.3em',
          WebkitTextSecurity: isVisible ? 'none' : 'disc',
        }}
      />
    </div>
  )
}

export default SecureTextareaField
