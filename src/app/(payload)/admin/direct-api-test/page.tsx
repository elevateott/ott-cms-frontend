'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DirectApiTestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: 'Test Video',
    description: 'This is a test video',
    sourceType: 'embedded',
    embeddedUrl: 'https://example.com/video.m3u8',
  })
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Create a video using our direct API endpoint
      const response = await fetch('/api/create-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log('API Response:', data)

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to create video')
        setResult(data)
      }
    } catch (err) {
      console.error('Error creating video:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const goToVideosList = () => {
    router.push('/admin/collections/videos')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>Direct API Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>
          This page creates a video directly using our custom API endpoint, bypassing the Payload CMS admin UI.
        </p>
        <p style={{ marginBottom: '10px' }}>
          We've simplified the Videos collection to the absolute minimum required fields and implemented a direct API endpoint.
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid #e2e8f0', 
            backgroundColor: '#f8fafc' 
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Create Video</h2>
            <p style={{ color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
              Enter the details for the new video
            </p>
          </div>
          
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label 
                  htmlFor="title" 
                  style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
                >
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label 
                  htmlFor="description" 
                  style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '4px',
                    fontSize: '1rem',
                    minHeight: '80px'
                  }}
                />
              </div>
              
              <div>
                <label 
                  htmlFor="sourceType" 
                  style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
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
                    backgroundColor: 'white'
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
                    style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
                  >
                    Embedded URL
                  </label>
                  <input
                    id="embeddedUrl"
                    name="embeddedUrl"
                    value={formData.embeddedUrl}
                    onChange={handleChange}
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
                
                <button 
                  type="button"
                  onClick={goToVideosList}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f0f0f0',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  View Videos List
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div style={{ 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid #e2e8f0', 
            backgroundColor: '#f8fafc' 
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Result</h2>
            <p style={{ color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
              Response from the API
            </p>
          </div>
          
          <div style={{ padding: '16px' }}>
            {error && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                backgroundColor: '#fee2e2', 
                border: '1px solid #fecaca',
                borderRadius: '4px',
                color: '#b91c1c'
              }}>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Error</h3>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}
            
            {result && !error && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                backgroundColor: '#dcfce7', 
                border: '1px solid #bbf7d0',
                borderRadius: '4px',
                color: '#166534'
              }}>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Success</h3>
                <p style={{ margin: 0 }}>Video created successfully!</p>
              </div>
            )}
            
            {result && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>Response Data:</h3>
                <pre style={{ 
                  backgroundColor: '#f1f5f9', 
                  padding: '12px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '300px',
                  fontSize: '0.75rem',
                  margin: 0
                }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '20px',
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #e9ecef',
        borderRadius: '5px',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Troubleshooting</h2>
        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '5px' }}>If you still encounter issues, try restarting the development server</li>
          <li style={{ marginBottom: '5px' }}>Clear your browser cache and cookies</li>
          <li style={{ marginBottom: '5px' }}>Try using a different browser</li>
          <li style={{ marginBottom: '5px' }}>Check the browser console and server logs for any errors</li>
        </ul>
      </div>
    </div>
  )
}
