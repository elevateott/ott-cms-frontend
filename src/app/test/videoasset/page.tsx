'use client'

import React, { useState } from 'react'
// Using custom CSS classes instead of shadcn components
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function TestVideoAssetPage() {
  const [title, setTitle] = useState('')
  const [assetId, setAssetId] = useState('')
  const [playbackId, setPlaybackId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test/create-videoasset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          assetId,
          playbackId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create video asset')
      }

      setResult(data)
      // Clear form on success
      setTitle('')
      setAssetId('')
      setPlaybackId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1>Test Video Asset Creation</h1>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Create Video Asset</div>
            <div className="card-description">
              Use this form to test creating a new video asset using the VideoAssetRepository.
            </div>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Title (required)
                </label>
                <input
                  id="title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="assetId" className="form-label">
                  Mux Asset ID (optional)
                </label>
                <input
                  id="assetId"
                  className="form-input"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="Enter Mux Asset ID"
                />
                <p className="text-sm text-gray-500">Example: ABCDEFghijkLMNOPqrstuv</p>
              </div>

              <div className="form-group">
                <label htmlFor="playbackId" className="form-label">
                  Mux Playback ID (optional)
                </label>
                <input
                  id="playbackId"
                  className="form-input"
                  value={playbackId}
                  onChange={(e) => setPlaybackId(e.target.value)}
                  placeholder="Enter Mux Playback ID"
                />
                <p className="text-sm text-gray-500">Example: 1234abcdEFGH5678ijklMNOP</p>
              </div>
            </form>
          </div>
          <div className="card-footer">
            <button
              onClick={handleSubmit}
              disabled={loading || !title}
              className={`btn btn-primary w-full ${loading ? 'disabled' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Video Asset'
              )}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Result</div>
            <div className="card-description">The response from the API will appear here.</div>
          </div>
          <div className="card-content">
            {error && (
              <div className="alert alert-error">
                <AlertCircle className="h-4 w-4" />
                <div className="alert-title">Error</div>
                <div>{error}</div>
              </div>
            )}

            {result && (
              <>
                <div className="alert alert-success">
                  <CheckCircle className="h-4 w-4" />
                  <div className="alert-title">Success</div>
                  <div>{result.message}</div>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">Created Video Asset:</h3>
                  <pre>{JSON.stringify(result.videoAsset, null, 2)}</pre>
                </div>
              </>
            )}

            {!error && !result && (
              <div className="text-center py-8 text-gray-500">
                Submit the form to see the result
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2>Instructions</h2>
        <div className="bg-gray-100 p-6 rounded-lg">
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter a title for the video asset (required)</li>
            <li>Optionally enter a Mux Asset ID and/or Playback ID</li>
            <li>Click "Create Video Asset" to submit the form</li>
            <li>The result will appear in the panel on the right</li>
            <li>
              If successful, you can view the created asset in the VideoAssets collection in the
              admin panel
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
