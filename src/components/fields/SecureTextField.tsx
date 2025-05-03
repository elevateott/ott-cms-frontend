'use client'

import { useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { Input } from '@/components/ui/input' // Assuming you're using shadcn Input
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'

const SecureTextField: TextFieldClientComponent = (props) => {
  const { path, field } = props
  const { label, required, admin } = field
  const { description } = admin || {}

  const { value, setValue } = useField<string>({ path })
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible((prev) => !prev)

  const getLabelText = () => {
    if (typeof label === 'string') return label
    if (typeof label === 'object' && label !== null) {
      // Pick English 'en' first, fallback to first value
      return label['en'] || Object.values(label)[0] || ''
    }
    return ''
  }

  const getDescriptionText = () => {
    if (typeof admin?.description === 'string') return admin.description
    if (typeof admin?.description === 'object' && admin.description !== null) {
      return admin.description['en'] || Object.values(admin.description)[0] || ''
    }
    return ''
  }

  return (
    <div className="relative">
      {label && (
        <label className="block mb-1 font-semibold">
          {getLabelText()} {required && '*'}
        </label>
      )}

      {/* Description */}
      {description && <p className="text-sm text-gray-500 mb-2">{getDescriptionText()}</p>}

      <div className="relative">
        <Input
          type={isVisible ? 'text' : 'password'}
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleVisibility}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
        >
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  )
}

export default SecureTextField
