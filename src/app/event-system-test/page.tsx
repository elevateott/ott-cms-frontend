'use client'

import Link from 'next/link'

export default function EventSystemTest() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Event System Testing Guide</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="mb-4">
          This page provides tools and instructions for testing the event system in the OTT CMS Frontend application.
        </p>
        <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">Event Flow</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Server-side events are emitted (from webhooks or API endpoints)</li>
            <li>Events are sent to connected clients via Server-Sent Events (SSE)</li>
            <li>The EventBridge component receives events and forwards them to the client-side eventBus</li>
            <li>Components like EventMonitor and ListViewRefresher react to the events</li>
          </ol>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Testing Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">SSE Connection Test</h3>
            <p className="mb-4">Test the raw SSE connection and event emission</p>
            <Link href="/test-sse-connection" className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Open SSE Connection Test
            </Link>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Event System Test</h3>
            <p className="mb-4">Test the client-side event bus and event handling</p>
            <Link href="/test-events" className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Open Event System Test
            </Link>
          </div>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-semibold text-lg mb-2">Event Monitor</h3>
          <p className="mb-4">
            The application includes an EventMonitor component that displays all events in real-time.
            This component is visible in the bottom-left corner of the application and can be expanded to show event details.
          </p>
          <Link href="/admin/collections/videoassets" className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            Go to Video Assets (with EventMonitor)
          </Link>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Endpoints for Testing</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Endpoint</th>
                <th className="border p-2 text-left">Method</th>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2"><code>/api/events/stream</code></td>
                <td className="border p-2">GET</td>
                <td className="border p-2">SSE endpoint for real-time events</td>
                <td className="border p-2">
                  <a 
                    href="/api/events/stream" 
                    target="_blank" 
                    className="text-blue-500 hover:underline"
                  >
                    Open Stream
                  </a>
                </td>
              </tr>
              <tr>
                <td className="border p-2"><code>/api/debug/test-sse</code></td>
                <td className="border p-2">GET</td>
                <td className="border p-2">Emit a test event to all connected clients</td>
                <td className="border p-2">
                  <a 
                    href="/api/debug/test-sse?event=video:created" 
                    target="_blank" 
                    className="text-blue-500 hover:underline"
                  >
                    Test video:created
                  </a>
                </td>
              </tr>
              <tr>
                <td className="border p-2"><code>/api/debug/emit-test-event</code></td>
                <td className="border p-2">POST</td>
                <td className="border p-2">Emit a test event with custom data</td>
                <td className="border p-2">
                  <button 
                    onClick={() => {
                      fetch('/api/debug/emit-test-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          event: 'video:created',
                          data: { id: 'test-123', title: 'Test Video' }
                        })
                      }).then(res => res.json()).then(data => {
                        alert(`Event emitted: ${JSON.stringify(data, null, 2)}`)
                      })
                    }}
                    className="text-blue-500 hover:underline"
                  >
                    Test POST
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Testing with cURL</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Monitor SSE Stream</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              curl -N http://localhost:3000/api/events/stream -H "Accept: text/event-stream"
            </pre>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Emit Test Event</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
{`curl -X POST http://localhost:3000/api/debug/emit-test-event \\
  -H "Content-Type: application/json" \\
  -d '{"event":"video:created","data":{"id":"test-123","title":"Test Video"}}'`}
            </pre>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Check Logs</h3>
            <p>Look for events in the server logs and browser console</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              logs/app.log
            </pre>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Check Client Count</h3>
            <p>Verify that clients are properly connected to the SSE stream</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              curl http://localhost:3000/api/debug/test-sse
            </pre>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Restart the Server</h3>
            <p>If all else fails, try restarting the development server</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              pnpm dev
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
