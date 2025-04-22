'use client'

import { clientLogger } from '@/utils/clientLogger';


import React, { useEffect } from 'react'

export default function DebugScriptPage() {
  useEffect(() => {
    // Add a global event listener to intercept form submissions
    const originalFetch = window.fetch
    window.fetch = async function(input, init) {
      // Check if this is a POST request to /api/videos
      if (
        typeof input === 'string' && 
        input.includes('/api/videos') && 
        init?.method === 'POST'
      ) {
        clientLogger.info('Intercepted fetch to /api/videos:', 'debug-script/page')
        clientLogger.info('URL:', input, 'debug-script/page')
        clientLogger.info('Method:', init.method, 'debug-script/page')
        clientLogger.info('Headers:', init.headers, 'debug-script/page')
        
        // Log the request body
        if (init.body) {
          if (typeof init.body === 'string') {
            try {
              const bodyJson = JSON.parse(init.body)
              clientLogger.info('Request Body (JSON):', bodyJson, 'debug-script/page')
            } catch (e) {
              clientLogger.info('Request Body (Text):', init.body, 'debug-script/page')
            }
          } else {
            clientLogger.info('Request Body (Non-string):', init.body, 'debug-script/page')
          }
        }
        
        // Also send the request to our debug endpoint
        try {
          const debugResponse = await originalFetch('/api/debug-payload-form', {
            method: 'POST',
            headers: init.headers,
            body: init.body,
          })
          const debugData = await debugResponse.json()
          clientLogger.info('Debug Endpoint Response:', debugData, 'debug-script/page')
        } catch (error) {
          clientLogger.error('Error sending to debug endpoint:', error, 'debug-script/page')
        }
      }
      
      // Continue with the original fetch
      return originalFetch.apply(this, arguments)
    }
    
    clientLogger.info('Debug script installed. Form submissions to /api/videos will be intercepted and logged.', 'debug-script/page')
    
    // Clean up
    return () => {
      window.fetch = originalFetch
      clientLogger.info('Debug script removed.', 'debug-script/page')
    }
  }, [])
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Debug Script Installed</h1>
      <p>This page has installed a debug script that will intercept and log all form submissions to /api/videos.</p>
      <p>Open the browser console to see the logs.</p>
      <p>Keep this page open in a separate tab while you try to create a video in the admin UI.</p>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e8f5e9', 
        border: '1px solid #c8e6c9',
        borderRadius: '5px',
        color: '#2e7d32'
      }}>
        <h3 style={{ marginTop: 0 }}>Instructions</h3>
        <ol>
          <li>Keep this tab open</li>
          <li>Open the browser console (F12 or right-click > Inspect > Console)</li>
          <li>In another tab, try to create a video in the admin UI</li>
          <li>Come back to this tab and check the console for logs</li>
        </ol>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Alternative Debug Pages</h3>
        <ul>
          <li>
            <a href="/admin/video-form" style={{ color: '#0070f3' }}>
              Video Form
            </a>
            {' - A simple form that mimics the Payload CMS admin form'}
          </li>
          <li>
            <a href="/admin/test-video-simple" style={{ color: '#0070f3' }}>
              Test Video Simple
            </a>
            {' - A simple page to create test videos with one click'}
          </li>
          <li>
            <a href="/api/test-video-create" style={{ color: '#0070f3' }}>
              Test Video Create API
            </a>
            {' - An API endpoint that creates a test video directly'}
          </li>
        </ul>
      </div>
    </div>
  )
}
