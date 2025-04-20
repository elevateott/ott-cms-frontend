'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetVideosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const resetVideosCollection = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/reset-videos-collection')
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to reset Videos collection')
        setResult(data)
      }
    } catch (err) {
      console.error('Error resetting Videos collection:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const goToVideosList = () => {
    router.push('/admin/collections/videos')
  }
  
  const goToCreateVideoForm = () => {
    router.push('/admin/collections/videos/create')
  }
  
  const goToRebuildVideos = () => {
    router.push('/admin/rebuild-videos')
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>Reset Videos Collection</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>
          This page will completely remove the Videos collection from the database and recreate it with minimal fields.
          This is a drastic step, but it will help us identify what's causing the issue with creating videos.
        </p>
        <p style={{ marginBottom: '10px' }}>
          <strong>Warning:</strong> This will delete all existing videos in the database. Make sure you have a backup if needed.
        </p>
      </div>
      
      <div style={{ 
        marginBottom: '20px',
        padding: '15px', 
        backgroundColor: '#fff8e6', 
        border: '1px solid #ffeeba',
        borderRadius: '5px',
        color: '#856404'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>What This Will Do</h2>
        <ol style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Drop the Videos collection from the database</li>
          <li style={{ marginBottom: '8px' }}>Drop the Videos versions collection</li>
          <li style={{ marginBottom: '8px' }}>Remove the Videos collection from Payload's internal registry</li>
          <li style={{ marginBottom: '8px' }}>Recreate the Videos collection with minimal fields (title and description only)</li>
          <li>Create a test video to verify the collection is working</li>
        </ol>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={resetVideosCollection}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Resetting...' : 'Reset Videos Collection'}
        </button>
        
        <button 
          onClick={goToRebuildVideos}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Rebuild Step by Step
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
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
        
        <button 
          onClick={goToCreateVideoForm}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Create Video Form
        </button>
      </div>
      
      {error && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          color: '#721c24'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>Error</h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}
      
      {result && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '5px',
          color: '#155724'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>Success</h3>
          <p style={{ margin: '0 0 10px 0' }}>{result.message || 'Videos collection has been reset successfully'}</p>
          
          <div style={{ marginTop: '10px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>Response Data:</h4>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '0.75rem',
              margin: 0
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: '20px',
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #e9ecef',
        borderRadius: '5px',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Next Steps</h2>
        <p style={{ marginBottom: '10px' }}>
          After resetting the Videos collection, you should:
        </p>
        <ol style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Try creating a video with the minimal collection</li>
          <li style={{ marginBottom: '8px' }}>If that works, use the "Rebuild Step by Step" page to add fields one at a time</li>
          <li style={{ marginBottom: '8px' }}>Identify which field or feature is causing the issue</li>
          <li>Fix the issue or find a workaround for that specific field or feature</li>
        </ol>
      </div>
    </div>
  )
}
