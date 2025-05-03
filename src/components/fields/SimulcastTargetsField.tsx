'use client'

import React, { useState } from 'react'
import { useField } from '@payloadcms/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'

const logger = clientLogger.createContextLogger('SimulcastTargetsField')

type SimulcastTarget = {
  name: string
  url: string
  streamKey: string
}

const SimulcastTargetsField: React.FC = () => {
  const { value = [], setValue } = useField<SimulcastTarget[]>({ path: 'simulcastTargets' })
  const [showStreamKeys, setShowStreamKeys] = useState<Record<number, boolean>>({})

  const handleAdd = () => {
    logger.info('Adding new simulcast target')
    setValue([...value, { name: '', url: '', streamKey: '' }])
  }

  const handleChange = (index: number, field: keyof SimulcastTarget, newValue: string) => {
    const updatedTargets = [...value]
    updatedTargets[index] = {
      ...updatedTargets[index],
      [field]: newValue,
    }
    setValue(updatedTargets)
  }

  const handleRemove = (index: number) => {
    logger.info(`Removing simulcast target at index ${index}`)
    setValue(value.filter((_, i) => i !== index))
  }

  const toggleStreamKeyVisibility = (index: number) => {
    setShowStreamKeys((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-medium">Simulcast Targets</Label>
        <Button 
          type="button" 
          onClick={handleAdd} 
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Target
        </Button>
      </div>
      
      <p className="text-sm text-gray-500">
        Add RTMP destinations to simulcast your live stream to other platforms like YouTube, Facebook, or Twitch.
      </p>
      
      {value.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          <p className="text-gray-500">No simulcast targets added yet</p>
          <Button 
            type="button" 
            onClick={handleAdd} 
            variant="outline" 
            className="mt-2"
          >
            Add Your First Target
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((target, index) => (
            <Card key={index} className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-center">
                  <span>{target.name || `Target ${index + 1}`}</span>
                  <Button
                    type="button"
                    onClick={() => handleRemove(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor={`target-${index}-name`}>Name</Label>
                  <Input
                    id={`target-${index}-name`}
                    value={target.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    placeholder="e.g., YouTube, Facebook, Twitch"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`target-${index}-url`}>RTMP URL</Label>
                  <Input
                    id={`target-${index}-url`}
                    value={target.url}
                    onChange={(e) => handleChange(index, 'url', e.target.value)}
                    placeholder="rtmp://..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`target-${index}-streamKey`}>Stream Key</Label>
                  <div className="relative">
                    <Input
                      id={`target-${index}-streamKey`}
                      type={showStreamKeys[index] ? 'text' : 'password'}
                      value={target.streamKey}
                      onChange={(e) => handleChange(index, 'streamKey', e.target.value)}
                      placeholder="Stream key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => toggleStreamKeyVisibility(index)}
                    >
                      {showStreamKeys[index] ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default SimulcastTargetsField
