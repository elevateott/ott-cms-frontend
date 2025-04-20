'use client'

import React, { useState } from 'react'

export default function VideoFormPage() {
  const [formData, setFormData] = useState({
    title: 'Test Video',
    description: 'This is a test video',
    sourceType: 'embedded',
    embeddedUrl: 'https://example.com/video.m3u8',
    slug: 'test-video',
    slugLock: true,
  })
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [requestDetails, setRequestDetails] = useState<any>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    setRequestDetails(null)

    try {
      // Log the request details
      const requestBody = JSON.stringify(formData, null, 2)
      console.log('Request Body:', requestBody)
      setRequestDetails({ body: formData })
      
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
      console.log('Response Text:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError)
        setError(`Failed to parse response as JSON: ${responseText}`)
        setRequestDetails(prev => ({
          ...prev,
          responseText
        }))
        return
      }
      
      console.log('Response Data:', data)
      setRequestDetails(prev => ({
        ...prev,
        response: data,
        status: response.status,
        statusText: response.statusText,
      }))

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.errors ? JSON.stringify(data.errors) : data.message || 'Failed to create video')
        setResult(data)
      }
    } catch (err) {
      console.error('Error creating video:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setRequestDetails(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : String(err)
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Video Form</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <form onSubmit={handleSubmit} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            padding: '20px',
          }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Title:
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description:
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '100px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Slug:
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Source Type:
              </label>
              <select
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="embedded">Embedded</option>
                <option value="mux">Mux</option>
              </select>
            </div>
            
            {formData.sourceType === 'embedded' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Embedded URL:
                </label>
                <input
                  type="text"
                  name="embeddedUrl"
                  value={formData.embeddedUrl}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  name="slugLock"
                  checked={formData.slugLock as boolean}
                  onChange={handleChange}
                />
                <span>Lock Slug</span>
              </label>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Video'}
            </button>
          </form>
        </div>
        
        <div style={{ flex: 1 }}>
          {error && (
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#ffebee', 
              border: '1px solid #ffcdd2',
              borderRadius: '5px',
              color: '#c62828'
            }}>
              <h3 style={{ marginTop: 0 }}>Error</h3>
              <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</p>
            </div>
          )}
          
          {result && (
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#e8f5e9', 
              border: '1px solid #c8e6c9',
              borderRadius: '5px',
              color: '#2e7d32'
            }}>
              <h3 style={{ marginTop: 0 }}>Success</h3>
              <p>Video created successfully!</p>
            </div>
          )}
          
          {requestDetails && (
            <div style={{ marginTop: '20px' }}>
              <h3>Request Details</h3>
              
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ marginBottom: '5px' }}>Request Body:</h4>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '5px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(requestDetails.body, null, 2)}
                </pre>
              </div>
              
              {requestDetails.status && (
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ marginBottom: '5px' }}>Response Status:</h4>
                  <p>{requestDetails.status} {requestDetails.statusText}</p>
                </div>
              )}
              
              {requestDetails.response && (
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ marginBottom: '5px' }}>Response Data:</h4>
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '5px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontSize: '12px'
                  }}>
                    {JSON.stringify(requestDetails.response, null, 2)}
                  </pre>
                </div>
              )}
              
              {requestDetails.responseText && !requestDetails.response && (
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ marginBottom: '5px' }}>Response Text:</h4>
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '5px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontSize: '12px'
                  }}>
                    {requestDetails.responseText}
                  </pre>
                </div>
              )}
              
              {requestDetails.error && (
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ marginBottom: '5px' }}>Error:</h4>
                  <p>{requestDetails.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
