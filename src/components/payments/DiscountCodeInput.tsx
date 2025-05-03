// src/components/payments/DiscountCodeInput.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface DiscountCodeInputProps {
  onApply: (code: string) => void
  onClear: () => void
  className?: string
}

export function DiscountCodeInput({ onApply, onClear, className = '' }: DiscountCodeInputProps) {
  const [code, setCode] = useState('')
  const [isApplied, setIsApplied] = useState(false)
  const { toast } = useToast()

  const handleApply = () => {
    if (!code.trim()) {
      toast({
        title: 'Please enter a discount code',
        variant: 'destructive',
      })
      return
    }

    onApply(code.trim())
    setIsApplied(true)
    toast({
      title: 'Discount code applied',
      description: 'Your discount code has been applied to your order.',
    })
  }

  const handleClear = () => {
    setCode('')
    setIsApplied(false)
    onClear()
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="text-sm font-medium">Discount Code</div>
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter discount code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isApplied}
          className="flex-1"
        />
        {isApplied ? (
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        ) : (
          <Button variant="outline" onClick={handleApply} disabled={!code.trim()}>
            Apply
          </Button>
        )}
      </div>
    </div>
  )
}
