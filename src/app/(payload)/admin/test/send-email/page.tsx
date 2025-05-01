'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { validateEmail } from '@/utils/validation'

export default function SendTestEmailPage() {
  const [toEmail, setToEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [emailConfig, setEmailConfig] = useState<{
    provider: string
    enabled: boolean
    fromAddress?: string
    fromName?: string
  } | null>(null)
  const [configLoading, setConfigLoading] = useState(true)

  // Fetch email configuration on component mount
  useEffect(() => {
    const fetchEmailConfig = async () => {
      try {
        const response = await fetch('/api/globals/email-settings')
        if (response.ok) {
          const data = await response.json()

          if (data.resendEnabled && data.resendFromAddress) {
            setEmailConfig({
              provider: 'Resend',
              enabled: true,
              fromAddress: data.resendFromAddress,
              fromName: data.resendFromName || 'OTT CMS',
            })
          } else {
            setEmailConfig({
              provider: 'None',
              enabled: false,
            })
          }
        } else {
          setEmailConfig({
            provider: 'Unknown',
            enabled: false,
          })
        }
      } catch (error) {
        console.error('Error fetching email configuration:', error)
        setEmailConfig({
          provider: 'Error',
          enabled: false,
        })
      } finally {
        setConfigLoading(false)
      }
    }

    fetchEmailConfig()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset messages
    setSuccessMessage('')
    setErrorMessage('')

    // Validate email
    const emailValidation = validateEmail(toEmail)
    if (!emailValidation.isValid) {
      setErrorMessage(emailValidation.error || 'Invalid email address')
      return
    }

    // Validate other fields
    if (!subject.trim()) {
      setErrorMessage('Subject is required')
      return
    }

    if (!message.trim()) {
      setErrorMessage('Message is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toEmail, subject, message }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage(`Email sent successfully to ${toEmail}`)
        // Clear form on success
        setToEmail('')
        setSubject('')
        setMessage('')
      } else {
        setErrorMessage(data.message || 'Failed to send email')
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred')
      console.error('Error sending test email:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Test Email Sending</h1>
      <p className="mb-6 text-gray-600">
        Use this form to test the email integration. This will send an email using the configured
        email adapter.
      </p>

      {/* Email Configuration Status */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Email Configuration Status</h2>
        {configLoading ? (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading configuration...</span>
          </div>
        ) : emailConfig?.enabled ? (
          <div>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="font-medium">Email is configured and enabled</span>
            </div>
            <ul className="list-disc list-inside ml-5 text-sm text-gray-600">
              <li>Provider: {emailConfig.provider}</li>
              <li>From Address: {emailConfig.fromAddress}</li>
              {emailConfig.fromName && <li>From Name: {emailConfig.fromName}</li>}
            </ul>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="font-medium">Email is not configured</span>
            </div>
            <p className="text-sm text-gray-600 ml-5">
              Please configure email settings in the{' '}
              <a href="/admin/globals/email-settings" className="text-blue-500 hover:underline">
                Email Settings
              </a>{' '}
              page.
            </p>
          </div>
        )}
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>Fill out the form below to send a test email</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="toEmail">Recipient Email</Label>
              <Input
                id="toEmail"
                type="email"
                placeholder="recipient@example.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Test Email Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {errorMessage && <div className="text-red-500 text-sm font-medium">{errorMessage}</div>}

            {successMessage && (
              <div className="text-green-500 text-sm font-medium">{successMessage}</div>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Test Email'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-8 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Testing Tips</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Configure email settings in the{' '}
            <a href="/admin/globals/email-settings" className="text-blue-500 hover:underline">
              Email Settings
            </a>{' '}
            global.
          </li>
          <li>
            Make sure you have enabled Resend and provided a valid API key and verified sender email
            address.
          </li>
          <li>Check the Resend dashboard to verify email delivery and see detailed logs.</li>
          <li>If emails are not being sent, check the server logs for any error messages.</li>
        </ul>
      </div>
    </div>
  )
}
