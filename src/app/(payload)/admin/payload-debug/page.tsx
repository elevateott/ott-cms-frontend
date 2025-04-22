'use client'

import { clientLogger } from '@/utils/clientLogger';


import React, { useState } from 'react'

export default function PayloadDebugPage() {
  const [copied, setCopied] = useState(false)
  
  const debugScript = `
// Payload CMS Form Debug Script
// Copy this entire script and paste it into your browser console when on the Payload CMS admin page

(function() {
  clientLogger.info('Payload CMS Form Debug Script installed', 'payload-debug/page');
  
  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    // Check if this is a POST request to /api/videos
    if (
      typeof input === 'string' && 
      input.includes('/api/videos') && 
      init?.method === 'POST'
    ) {
      clientLogger.info('%c🔍 Intercepted POST to /api/videos', 'font-weight: bold; color: blue;', 'payload-debug/page');
      clientLogger.info('URL:', input, 'payload-debug/page');
      
      // Log the request body
      if (init.body) {
        if (typeof init.body === 'string') {
          try {
            const bodyJson = JSON.parse(init.body);
            clientLogger.info('%cRequest Body (JSON):', 'font-weight: bold;', bodyJson, 'payload-debug/page');
            
            // Check for common issues
            if (!bodyJson.title) {
              clientLogger.warn('⚠️ Missing required field: title', 'payload-debug/page');
            }
            if (!bodyJson.sourceType) {
              clientLogger.warn('⚠️ Missing required field: sourceType', 'payload-debug/page');
            }
            if (bodyJson.sourceType === 'embedded' && !bodyJson.embeddedUrl) {
              clientLogger.warn('⚠️ Missing field: embeddedUrl (required for embedded videos)', 'payload-debug/page');
            }
            if (!bodyJson.slug) {
              clientLogger.warn('⚠️ Missing field: slug', 'payload-debug/page');
            }
          } catch (e) {
            clientLogger.info('Request Body (Text):', init.body, 'payload-debug/page');
          }
        } else {
          clientLogger.info('Request Body (Non-string):', init.body, 'payload-debug/page');
        }
      }
      
      // Make a copy of the request to modify and send to our endpoint
      const requestCopy = {
        method: init.method,
        headers: { ...init.headers },
        body: init.body
      };
      
      // Send a copy to our debug endpoint
      try {
        const debugResponse = await originalFetch('/api/debug-payload-form', requestCopy);
        const debugData = await debugResponse.json();
        clientLogger.info('%cDebug Endpoint Response:', 'font-weight: bold;', debugData, 'payload-debug/page');
      } catch (error) {
        clientLogger.error('Error sending to debug endpoint:', error, 'payload-debug/page');
      }
      
      // Continue with the original request
      try {
        const response = await originalFetch.apply(this, arguments);
        
        // Clone the response so we can read the body
        const responseClone = response.clone();
        
        // Try to parse the response as JSON
        try {
          const responseData = await responseClone.json();
          clientLogger.info('%cResponse Data:', 'font-weight: bold; color: green;', responseData, 'payload-debug/page');
          
          if (!response.ok) {
            clientLogger.error('%cError Response:', 'font-weight: bold; color: red;', responseData, 'payload-debug/page');
          }
        } catch (e) {
          // If it's not JSON, get the text
          const responseText = await responseClone.text();
          clientLogger.info('Response Text:', responseText, 'payload-debug/page');
        }
        
        return response;
      } catch (error) {
        clientLogger.error('%cFetch Error:', 'font-weight: bold; color: red;', error, 'payload-debug/page');
        throw error;
      }
    }
    
    // For all other requests, just pass through
    return originalFetch.apply(this, arguments);
  };
  
  // Also intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._method = method;
    this._url = url;
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    // Check if this is a POST request to /api/videos
    if (
      this._method === 'POST' && 
      typeof this._url === 'string' && 
      this._url.includes('/api/videos')
    ) {
      clientLogger.info('%c🔍 Intercepted XHR POST to /api/videos', 'font-weight: bold; color: purple;', 'payload-debug/page');
      clientLogger.info('URL:', this._url, 'payload-debug/page');
      
      // Log the request body
      if (body) {
        if (typeof body === 'string') {
          try {
            const bodyJson = JSON.parse(body);
            clientLogger.info('%cXHR Request Body (JSON):', 'font-weight: bold;', bodyJson, 'payload-debug/page');
          } catch (e) {
            clientLogger.info('XHR Request Body (Text):', body, 'payload-debug/page');
          }
        } else {
          clientLogger.info('XHR Request Body (Non-string):', body, 'payload-debug/page');
        }
      }
      
      // Add a response listener
      this.addEventListener('load', function() {
        clientLogger.info('%cXHR Response Status:', 'font-weight: bold;', this.status, 'payload-debug/page');
        
        try {
          const responseData = JSON.parse(this.responseText);
          clientLogger.info('%cXHR Response Data:', 'font-weight: bold; color: green;', responseData, 'payload-debug/page');
          
          if (this.status >= 400) {
            clientLogger.error('%cXHR Error Response:', 'font-weight: bold; color: red;', responseData, 'payload-debug/page');
          }
        } catch (e) {
          clientLogger.info('XHR Response Text:', this.responseText, 'payload-debug/page');
        }
      });
    }
    
    return originalXHRSend.apply(this, arguments);
  };
  
  clientLogger.info('Payload CMS Form Debug Script ready. Try creating a video now.', 'payload-debug/page');
})();
  `.trim()
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(debugScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Payload CMS Debug Script</h1>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#e8f5e9', 
        border: '1px solid #c8e6c9',
        borderRadius: '5px',
        color: '#2e7d32'
      }}>
        <h3 style={{ marginTop: 0 }}>Instructions</h3>
        <ol>
          <li>Copy the script below</li>
          <li>Navigate to the Payload CMS admin page where you create videos</li>
          <li>Open the browser console (F12 or right-click > Inspect > Console)</li>
          <li>Paste the script into the console and press Enter</li>
          <li>Try to create a video and watch the console for detailed logs</li>
        </ol>
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Debug Script</h3>
        <button 
          onClick={copyToClipboard}
          style={{
            padding: '8px 16px',
            backgroundColor: copied ? '#4caf50' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
      
      <pre style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        overflow: 'auto',
        maxHeight: '500px',
        fontSize: '14px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap'
      }}>
        {debugScript}
      </pre>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Alternative Solutions</h3>
        <p>If you're still having issues with the Payload CMS admin form, you can use these alternatives:</p>
        
        <ul style={{ marginTop: '10px' }}>
          <li style={{ marginBottom: '10px' }}>
            <a 
              href="/admin/video-form" 
              style={{ 
                color: '#0070f3',
                fontWeight: 'bold',
                textDecoration: 'none'
              }}
            >
              Custom Video Form
            </a>
            <p style={{ margin: '5px 0 0 0' }}>
              A simple form that works for creating videos. Use this as a temporary solution.
            </p>
          </li>
          
          <li style={{ marginBottom: '10px' }}>
            <a 
              href="/admin/test-video-simple" 
              style={{ 
                color: '#0070f3',
                fontWeight: 'bold',
                textDecoration: 'none'
              }}
            >
              One-Click Video Creator
            </a>
            <p style={{ margin: '5px 0 0 0' }}>
              Creates a test video with one click. Useful for quickly adding videos.
            </p>
          </li>
          
          <li>
            <a 
              href="/api/test-video-create" 
              style={{ 
                color: '#0070f3',
                fontWeight: 'bold',
                textDecoration: 'none'
              }}
            >
              API Video Creator
            </a>
            <p style={{ margin: '5px 0 0 0' }}>
              Creates a test video directly via the API. No UI involved.
            </p>
          </li>
        </ul>
      </div>
    </div>
  )
}
