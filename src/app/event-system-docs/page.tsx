'use client'

import Link from 'next/link'

export default function EventSystemDocs() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Event System Documentation</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="mb-4">
          The OTT CMS uses an event-driven architecture to handle video processing and updates.
          Events flow from the server (via webhooks) to the client through Server-Sent Events (SSE).
        </p>
        <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">Event Flow</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Mux webhook triggers <code className="bg-gray-100 px-1 rounded">videoAssetWebhookHandler</code></li>
            <li>Handler emits event via <code className="bg-gray-100 px-1 rounded">eventService.emit()</code></li>
            <li>Event is sent to SSE clients via <code className="bg-gray-100 px-1 rounded">sendEventToClients()</code></li>
            <li>Client <code className="bg-gray-100 px-1 rounded">EventBridge</code> receives event and forwards to client eventBus</li>
            <li>Components like <code className="bg-gray-100 px-1 rounded">EventMonitor</code> and <code className="bg-gray-100 px-1 rounded">ListViewRefresher</code> react to events</li>
          </ol>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Testing Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">SSE Test Page</h3>
            <p className="mb-4">Test the raw SSE connection and event emission</p>
            <Link href="/test-sse" className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Open SSE Test Page
            </Link>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Event System Test Page</h3>
            <p className="mb-4">Test the client-side event bus and event handling</p>
            <Link href="/test-events" className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Open Event Test Page
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Endpoint</th>
                <th className="border p-2 text-left">Method</th>
                <th className="border p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2"><code>/api/events/stream</code></td>
                <td className="border p-2">GET</td>
                <td className="border p-2">SSE endpoint for real-time events</td>
              </tr>
              <tr>
                <td className="border p-2"><code>/api/debug/emit-test-event</code></td>
                <td className="border p-2">POST</td>
                <td className="border p-2">Emit a test event from the server</td>
              </tr>
              <tr>
                <td className="border p-2"><code>/api/mux/webhook</code></td>
                <td className="border p-2">POST</td>
                <td className="border p-2">Webhook endpoint for Mux events</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Check SSE Connection</h3>
            <p className="mb-2">Use the SSE Test Page to verify the connection is working</p>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              curl -N http://localhost:3000/api/events/stream -H "Accept: text/event-stream"
            </pre>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Test Event Emission</h3>
            <p className="mb-2">Use the debug endpoint to emit a test event</p>
            <pre className="bg-gray-100 p-2 rounded text-sm">
{`curl -X POST http://localhost:3000/api/debug/emit-test-event \\
  -H "Content-Type: application/json" \\
  -d '{"event":"video:created","data":{"id":"test-123","title":"Test Video"}}'`}
            </pre>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Check Logs</h3>
            <p>Look for events in the server logs and browser console</p>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Key Components</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Server-Side</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>src/services/events/eventEmitter.ts</code> - Server-side event bus</li>
              <li><code>src/services/eventService/index.ts</code> - Event service singleton</li>
              <li><code>src/app/api/events/stream/route.ts</code> - SSE endpoint</li>
              <li><code>src/services/mux/videoAssetWebhookHandler.ts</code> - Webhook handler</li>
            </ul>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Client-Side</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>src/utilities/eventBus.ts</code> - Client-side event bus</li>
              <li><code>src/components/EventProvider/EventBridge.tsx</code> - SSE to eventBus bridge</li>
              <li><code>src/components/EventMonitor/EventMonitor.tsx</code> - Event display component</li>
              <li><code>src/collections/VideoAssets/components/ListViewRefresher.tsx</code> - List refresh component</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
