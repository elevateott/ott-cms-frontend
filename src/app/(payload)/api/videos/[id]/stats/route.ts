import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { _id } = await context.params

    // Generate mock data for demonstration purposes
    const daily = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))

      return {
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 10,
      }
    })

    // Calculate total views
    const totalViews = daily.reduce((sum, day) => sum + day.views, 0)

    return Response.json({
      views: {
        total: totalViews,
        daily,
      },
      engagement: {
        averageWatchTime: 120,
        completionRate: 0.75,
      },
    })
  } catch (error) {
    console.error(
      'Error fetching video stats:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return Response.json({ error: 'Failed to fetch video statistics' }, { status: 500 })
  }
}
