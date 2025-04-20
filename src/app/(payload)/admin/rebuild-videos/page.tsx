'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RebuildVideosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  
  // Define the steps to rebuild the Videos collection
  const steps = [
    {
      name: 'Reset Videos Collection',
      description: 'Completely remove the Videos collection from the database and recreate it with minimal fields',
      action: resetVideosCollection,
    },
    {
      name: 'Test Minimal Collection',
      description: 'Test creating a video with the minimal collection (title and description only)',
      action: testMinimalCollection,
    },
    {
      name: 'Add Slug Field',
      description: 'Add the slug field to the collection and test it',
      action: addSlugField,
    },
    {
      name: 'Add Source Type Field',
      description: 'Add the sourceType field to the collection and test it',
      action: addSourceTypeField,
    },
    {
      name: 'Add Embedded URL Field',
      description: 'Add the embeddedUrl field to the collection and test it',
      action: addEmbeddedUrlField,
    },
    {
      name: 'Add Mux Data Field',
      description: 'Add the muxData field to the collection and test it',
      action: addMuxDataField,
    },
    {
      name: 'Add Thumbnail Field',
      description: 'Add the thumbnail field to the collection and test it',
      action: addThumbnailField,
    },
    {
      name: 'Add Hooks',
      description: 'Add the hooks to the collection and test them',
      action: addHooks,
    },
    {
      name: 'Add Custom Components',
      description: 'Add the custom components to the collection and test them',
      action: addCustomComponents,
    },
  ]
  
  // Reset the Videos collection
  async function resetVideosCollection() {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/reset-videos-collection')
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
        return true
      } else {
        setError(data.error || 'Failed to reset Videos collection')
        setResult(data)
        return false
      }
    } catch (err) {
      console.error('Error resetting Videos collection:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }
  
  // Test creating a video with the minimal collection
  async function testMinimalCollection() {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/create-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Minimal Collection',
          description: 'This video was created with the minimal collection',
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
        return true
      } else {
        setError(data.error || 'Failed to create video with minimal collection')
        setResult(data)
        return false
      }
    } catch (err) {
      console.error('Error testing minimal collection:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }
  
  // Placeholder functions for the remaining steps
  // These would be implemented to update the Videos collection configuration
  // and test each new field or feature
  async function addSlugField() {
    // This would update the Videos collection to add the slug field
    // and test creating a video with it
    alert('This step would add the slug field to the collection and test it')
    return true
  }
  
  async function addSourceTypeField() {
    alert('This step would add the sourceType field to the collection and test it')
    return true
  }
  
  async function addEmbeddedUrlField() {
    alert('This step would add the embeddedUrl field to the collection and test it')
    return true
  }
  
  async function addMuxDataField() {
    alert('This step would add the muxData field to the collection and test it')
    return true
  }
  
  async function addThumbnailField() {
    alert('This step would add the thumbnail field to the collection and test it')
    return true
  }
  
  async function addHooks() {
    alert('This step would add the hooks to the collection and test them')
    return true
  }
  
  async function addCustomComponents() {
    alert('This step would add the custom components to the collection and test them')
    return true
  }
  
  // Execute the current step
  const executeStep = async () => {
    const success = await steps[step].action()
    if (success) {
      // Move to the next step if successful
      if (step < steps.length - 1) {
        setStep(step + 1)
      }
    }
  }
  
  // Go to the Videos list
  const goToVideosList = () => {
    router.push('/admin/collections/videos')
  }
  
  // Go to the create video form
  const goToCreateVideoForm = () => {
    router.push('/admin/collections/videos/create')
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>Rebuild Videos Collection</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>
          This page helps you completely rebuild the Videos collection step by step to identify what's causing the issue.
        </p>
        <p style={{ marginBottom: '10px' }}>
          We'll start by completely removing the Videos collection from the database and recreating it with minimal fields.
          Then we'll add one field at a time until we find the culprit.
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Steps</h2>
            <p style={{ color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
              Follow these steps to rebuild the Videos collection
            </p>
          </div>
          
          <div style={{ padding: '16px' }}>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              {steps.map((s, i) => (
                <li key={i} style={{ 
                  marginBottom: '12px',
                  color: i === step ? '#0070f3' : i < step ? '#16a34a' : 'inherit',
                  fontWeight: i === step ? 'bold' : 'normal',
                }}>
                  {s.name}
                  <p style={{ 
                    margin: '4px 0 0 0',
                    fontSize: '0.875rem',
                    color: '#64748b',
                    fontWeight: 'normal',
                  }}>
                    {s.description}
                  </p>
                </li>
              ))}
            </ol>
            
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={executeStep}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  width: '100%',
                }}
              >
                {loading ? 'Processing...' : `Execute Step ${step + 1}: ${steps[step].name}`}
              </button>
            </div>
            
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
              <button 
                onClick={goToVideosList}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                View Videos List
              </button>
              
              <button 
                onClick={goToCreateVideoForm}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                Create Video Form
              </button>
            </div>
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
              Response from the current step
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
                <p style={{ margin: 0 }}>{result.message || 'Operation completed successfully'}</p>
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
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Instructions</h2>
        <ol style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Step 1:</strong> Reset the Videos collection to start with a clean slate
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Step 2:</strong> Test creating a video with the minimal collection (title and description only)
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Step 3-7:</strong> Add one field at a time and test after each addition
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Step 8-9:</strong> Add hooks and custom components last
          </li>
          <li>
            If an error occurs at any step, you've found the culprit!
          </li>
        </ol>
      </div>
    </div>
  )
}
