'use client'

import React, { useState, useEffect } from 'react'
import { ContentCarousel } from '@/components/ContentCarousel'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { clientLogger } from '@/utils/clientLogger'

export default function CarouselsTestPage() {
  const [carousels, setCarousels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCarousels = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/carousels?page=home')

        if (!response.ok) {
          throw new Error(`Failed to fetch carousels: ${response.status}`)
        }

        const data = await response.json()
        setCarousels(data.docs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        clientLogger.error('Error fetching carousels:', err, 'CarouselsTestPage')
      } finally {
        setLoading(false)
      }
    }

    fetchCarousels()
  }, [])

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Carousel System Test Page</h1>
      
      <Tabs defaultValue="preview">
        <TabsList className="mb-8">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="usage">Usage Guide</TabsTrigger>
          <TabsTrigger value="admin">Admin Guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="space-y-8">
          <div className="p-6 bg-card rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Live Carousels Preview</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading carousels...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                <p className="font-semibold">Error loading carousels:</p>
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : carousels.length === 0 ? (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-lg mb-4">No carousels found</p>
                <p className="text-muted-foreground mb-6">
                  Create carousels in the admin panel to see them here
                </p>
                <Button 
                  onClick={() => window.open('/admin/collections/carousels', '_blank')}
                >
                  Create Carousels
                </Button>
              </div>
            ) : (
              <div>
                {carousels.map((carousel: any) => (
                  <ContentCarousel
                    key={carousel.id}
                    title={carousel.title}
                    description={carousel.description}
                    items={carousel.items || []}
                    displayOptions={carousel.displayOptions}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-8">
          <div className="p-6 bg-card rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">How to Use Carousels in Your Pages</h2>
            
            <div className="prose dark:prose-invert max-w-none">
              <p>
                The carousel system allows you to display Netflix-style content rows on any page.
                Here's how to implement it:
              </p>
              
              <h3>1. Import the CarouselsContainer Component</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                {`import { CarouselsContainer } from '@/components/CarouselsContainer'`}
              </pre>
              
              <h3>2. Add the Component to Your Page</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                {`<CarouselsContainer page="home" />`}
              </pre>
              
              <p>
                The <code>page</code> prop determines which carousels to display. Valid options are:
              </p>
              <ul>
                <li><code>home</code> - Shows carousels configured for the home page</li>
                <li><code>content</code> - Shows carousels configured for the content library</li>
                <li><code>series</code> - Shows carousels configured for the series library</li>
              </ul>
              
              <h3>3. Server-Side Data Fetching (Optional)</h3>
              <p>
                For better performance, you can fetch carousels on the server and pass them as initial data:
              </p>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                {`// In your server component
const carouselsResult = await payload.find({
  collection: 'carousels',
  sort: 'order',
  where: {
    and: [
      { isActive: { equals: true } },
      { showOnPages: { contains: 'home' } },
    ],
  },
  depth: 2,
})

// Then in your JSX
<CarouselsContainer 
  page="home" 
  initialData={carouselsResult.docs} 
/>`}
              </pre>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="admin" className="space-y-8">
          <div className="p-6 bg-card rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Guide: Creating and Managing Carousels</h2>
            
            <div className="prose dark:prose-invert max-w-none">
              <p>
                Carousels are managed through the admin panel. Here's how to create and configure them:
              </p>
              
              <h3>1. Create a New Carousel</h3>
              <p>
                Navigate to <a href="/admin/collections/carousels" target="_blank" rel="noopener noreferrer">Carousels</a> in the admin panel and click "Create New".
              </p>
              
              <h3>2. Basic Information</h3>
              <ul>
                <li><strong>Title:</strong> The heading displayed above the carousel (e.g., "Latest Releases")</li>
                <li><strong>Description:</strong> Optional text displayed below the title</li>
              </ul>
              
              <h3>3. Add Items</h3>
              <p>
                In the "Carousel Items" section, click "Add Item" to add content or series:
              </p>
              <ul>
                <li><strong>Item Type:</strong> Choose between Content or Series</li>
                <li><strong>Item:</strong> Select the specific content or series to include</li>
                <li><strong>Order:</strong> Set the position (1 = first, 2 = second, etc.)</li>
                <li><strong>Custom Title/Description:</strong> Optionally override the original metadata</li>
              </ul>
              
              <h3>4. Display Options</h3>
              <p>Configure how the carousel appears:</p>
              <ul>
                <li><strong>Layout:</strong> Standard, Featured (large), or Compact</li>
                <li><strong>Items Per View:</strong> How many items to show at once</li>
                <li><strong>Navigation:</strong> Show/hide arrows and dots</li>
                <li><strong>Autoplay:</strong> Enable automatic scrolling</li>
              </ul>
              
              <h3>5. Visibility Settings</h3>
              <p>Control where and when the carousel appears:</p>
              <ul>
                <li><strong>Is Active:</strong> Toggle to show/hide the carousel</li>
                <li><strong>Order:</strong> Position on the page (lower numbers appear first)</li>
                <li><strong>Show On Pages:</strong> Select which pages display this carousel</li>
                <li><strong>Visible From/Until:</strong> Schedule when the carousel appears</li>
              </ul>
              
              <h3>Important Notes</h3>
              <ul>
                <li>Item order values are automatically adjusted to prevent duplicates</li>
                <li>Carousels with no items will not be displayed</li>
                <li>Changes to carousels are reflected immediately on the frontend</li>
              </ul>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={() => window.open('/admin/collections/carousels', '_blank')}
              >
                Go to Carousels Admin
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
