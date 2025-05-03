'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function TestDefaultFormPage() {
  const router = useRouter()

  const goToCreateVideo = () => {
    router.push('/admin/collections/videos/create')
  }

  const goToVideosList = () => {
    router.push('/admin/collections/videos')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>Test Default Form</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>
          This page helps you test the default Payload CMS form for creating videos.
        </p>
        <p style={{ marginBottom: '10px' }}>
          We've simplified the Videos collection to focus on the core functionality and removed any custom components
          that might be interfering with the default form.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={goToCreateVideo}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Go to Create Video Form
        </button>
        
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
          Go to Videos List
        </button>
      </div>
      
      <div style={{ 
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
          <li style={{ marginBottom: '5px' }}>Check the browser console for any errors</li>
        </ul>
      </div>
      
      <div style={{ 
        marginTop: '20px',
        padding: '15px', 
        backgroundColor: '#e8f5e9', 
        border: '1px solid #c8e6c9',
        borderRadius: '5px',
        color: '#2e7d32'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Backup Information</h2>
        <p>
          We've created a backup of the original Videos collection at <code>src/collections/Videos/index.backup.ts</code>.
          If you need to restore the original configuration, you can copy the contents of this file back to <code>src/collections/Videos/index.ts</code>.
        </p>
      </div>
    </div>
  )
}
