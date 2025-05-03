'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

export default function CreateSubscriptionPlanPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [interval, setInterval] = useState('month')
  const [trialPeriodDays, setTrialPeriodDays] = useState('0')
  const [setupFeeAmount, setSetupFeeAmount] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [isDefault, setIsDefault] = useState(false)
  const [paymentProvider, setPaymentProvider] = useState('all')
  const [loading, setLoading] = useState(false)
  
  // Show warning if both trial and setup fee are set
  const showPaidTrialWarning = parseInt(trialPeriodDays) > 0 && parseInt(setupFeeAmount) > 0
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Convert price and setup fee from dollars to cents
      const priceInCents = Math.round(parseFloat(price) * 100)
      const setupFeeInCents = Math.round(parseFloat(setupFeeAmount) * 100)
      
      // Validate inputs
      if (!name) {
        throw new Error('Plan name is required')
      }
      
      if (isNaN(priceInCents) || priceInCents < 0) {
        throw new Error('Price must be a valid number')
      }
      
      if (isNaN(setupFeeInCents) || setupFeeInCents < 0) {
        throw new Error('Setup fee must be a valid number')
      }
      
      const trialDays = parseInt(trialPeriodDays)
      if (isNaN(trialDays) || trialDays < 0 || trialDays > 30) {
        throw new Error('Trial period must be between 0 and 30 days')
      }
      
      // Create the plan
      const response = await fetch('/api/subscription-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          price: priceInCents,
          interval,
          trialPeriodDays: trialDays,
          setupFeeAmount: setupFeeInCents,
          isActive,
          isDefault,
          paymentProvider,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || data.error || 'Failed to create subscription plan')
      }
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Subscription plan created successfully',
        variant: 'default',
      })
      
      // Redirect to the subscription plans test page
      router.push('/test/subscription-plans')
    } catch (error) {
      clientLogger.error(error, 'CreateSubscriptionPlanPage.handleSubmit')
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create subscription plan',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Create Subscription Plan</h1>
      <p className="text-gray-500 mb-6">
        Test page for creating subscription plans with free trials and setup fees
      </p>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Subscription Plan</CardTitle>
          <CardDescription>
            Create a new subscription plan with optional trial period and setup fee
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Premium Plan"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Access to all premium content"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="9.99"
                  required
                />
                <p className="text-xs text-gray-500">Enter price in dollars (e.g., 9.99)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interval">Billing Interval</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger id="interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trialPeriodDays">Free Trial (Days)</Label>
                <Input
                  id="trialPeriodDays"
                  type="number"
                  min="0"
                  max="30"
                  value={trialPeriodDays}
                  onChange={(e) => setTrialPeriodDays(e.target.value)}
                />
                <p className="text-xs text-gray-500">0 = no trial. Up to 30 days allowed.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="setupFeeAmount">Setup Fee ($)</Label>
                <Input
                  id="setupFeeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={setupFeeAmount}
                  onChange={(e) => setSetupFeeAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500">One-time fee charged at signup</p>
              </div>
            </div>
            
            {showPaidTrialWarning && (
              <Alert className="bg-amber-50 border-amber-200">
                <InfoIcon className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Paid Trial Configuration</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <p>
                    You've configured a {trialPeriodDays}-day trial with a ${setupFeeAmount} setup fee.
                    The setup fee will be charged immediately, and recurring billing will start after the
                    trial period ends.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active Plan</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isDefault">Default Plan</Label>
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Provider</Label>
              <RadioGroup value={paymentProvider} onValueChange={setPaymentProvider}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All Providers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe">Stripe Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal">PayPal Only</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/test/subscription-plans')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Plan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
