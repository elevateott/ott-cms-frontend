'use client'

import React, { useState } from 'react'

export default function TestVideoSimplePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTestVideo = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/test-video-create')
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to create test video')
        setResult(data)
      }
    } catch (err) {
      console.error('Error creating test video:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Simple Test Video Creator</h1>
      
      <button 
        onClick={createTestVideo}
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
        {loading ? 'Creating...' : 'Create Test Video'}
      </button>
      
      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #ffcdd2',
          borderRadius: '5px',
          color: '#c62828'
        }}>
          <h3 style={{ marginTop: 0 }}>Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: result.success ? '#e8f5e9' : '#ffebee', 
          border: `1px solid ${result.success ? '#c8e6c9' : '#ffcdd2'}`,
          borderRadius: '5px',
          color: result.success ? '#2e7d32' : '#c62828'
        }}>
          <h3 style={{ marginTop: 0 }}>{result.success ? 'Success' : 'Error'}</h3>
          <p>{result.message}</p>
          
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ marginBottom: '10px' }}>Response Data:</h4>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '5px',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '12px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
