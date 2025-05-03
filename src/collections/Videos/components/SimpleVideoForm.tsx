'use client'

import { clientLogger } from '@/utils/clientLogger';


import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { eventBus } from '@/utilities/eventBus'

const SimpleVideoForm: React.FC = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sourceType: 'embedded',
    embeddedUrl: 'https://example.com/video.m3u8',
    slug: '',
    slugLock: true,
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    // Auto-generate slug from title if title changes and slug is empty or locked
    if (name === 'title' && (formData.slugLock || !formData.slug)) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        slug,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Create a video using the direct Payload API
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      // Get the response text first to ensure we can see it even if JSON parsing fails
      const responseText = await response.text()
      clientLogger.info('Response Text:', responseText, 'components/SimpleVideoForm')

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        clientLogger.error('Error parsing response as JSON:', parseError, 'components/SimpleVideoForm')
        setError(`Failed to parse response as JSON: ${responseText}`)
        return
      }

      clientLogger.info('Response Data:', data, 'components/SimpleVideoForm')

      if (response.ok) {
        setResult(data)

        // Emit an event to refresh the list view
        eventBus.emit('video:created', { video: data.data })

        // Reset the form after successful submission
        setFormData({
          title: '',
          description: '',
          sourceType: 'embedded',
          embeddedUrl: 'https://example.com/video.m3u8',
          slug: '',
          slugLock: true,
        })

        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setError(
          data.errors ? JSON.stringify(data.errors) : data.message || 'Failed to create video',
        )
        setResult(data)
      }
    } catch (err) {
      clientLogger.error('Error creating video:', err, 'components/SimpleVideoForm')
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
        Create New Video
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Video Details</h3>
            <p style={{ color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
              Enter the details for the new video
            </p>
          </div>

          <div style={{ padding: '16px' }}>
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label
                  htmlFor="title"
                  style={{ display: 'block', marginBottom: '8px', fontWeight: 'medium' }}
                >
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter video title"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  style={{ display: 'block', marginBottom: '8px', fontWeight: 'medium' }}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter video description"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    minHeight: '80px',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  style={{ display: 'block', marginBottom: '8px', fontWeight: 'medium' }}
                >
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="video-slug"
                  disabled={formData.slugLock}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: formData.slugLock ? '#f1f5f9' : 'white',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    id="slugLock"
                    name="slugLock"
                    checked={formData.slugLock as boolean}
                    onChange={handleChange}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="slugLock" style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Auto-generate from title
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sourceType"
                  style={{ display: 'block', marginBottom: '8px', fontWeight: 'medium' }}
                >
                  Source Type
                </label>
                <select
                  id="sourceType"
                  name="sourceType"
                  value={formData.sourceType}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="embedded">Embedded</option>
                  <option value="mux">Mux</option>
                </select>
              </div>

              {formData.sourceType === 'embedded' && (
                <div>
                  <label
                    htmlFor="embeddedUrl"
                    style={{ display: 'block', marginBottom: '8px', fontWeight: 'medium' }}
                  >
                    Embedded URL
                  </label>
                  <input
                    id="embeddedUrl"
                    name="embeddedUrl"
                    value={formData.embeddedUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/video.m3u8"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
              )}
            </form>
          </div>

          <div
            style={{ padding: '16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
          >
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Video'}
            </button>
          </div>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Result</h3>
            <p style={{ color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
              Response from the API
            </p>
          </div>

          <div style={{ padding: '16px' }}>
            {error && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#b91c1c',
                }}
              >
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Error</h4>
                <p style={{ margin: 0, wordBreak: 'break-all' }}>{error}</p>
              </div>
            )}

            {result && !error && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  color: '#166534',
                }}
              >
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Success</h4>
                <p style={{ margin: 0 }}>Video created successfully!</p>
              </div>
            )}

            {result && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 'medium', marginBottom: '8px' }}>
                  Response Data:
                </h4>
                <pre
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '240px',
                    fontSize: '0.75rem',
                    margin: 0,
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleVideoForm
