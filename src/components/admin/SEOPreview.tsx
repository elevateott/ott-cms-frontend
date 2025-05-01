'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

type SEOPreviewProps = {
  title?: string
  description?: string
  canonicalURL?: string
}

const SEOPreview: React.FC<SEOPreviewProps> = (props) => {
  // Get field values from form context
  const { value: formData } = useField({ path: '' }) || { value: {} }

  // Use props if provided, otherwise try to get from form data
  const title = props.title || formData?.meta?.title || formData?.title || 'Page Title'

  const description =
    props.description ||
    formData?.meta?.description ||
    formData?.description ||
    'This is a short description of your content, optimized for search engines.'

  const canonicalURL =
    props.canonicalURL ||
    formData?.meta?.canonicalURL ||
    `https://yourdomain.com/${formData?.slug || 'page-title'}`

  return (
    <div className="border rounded p-4 bg-white mt-4 text-sm max-w-xl shadow">
      <h3 className="text-base font-semibold mb-3">Search Engine Preview</h3>
      <div className="text-blue-600 text-sm mb-1 truncate">{canonicalURL}</div>
      <div className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">{title}</div>
      <div className="text-gray-600 line-clamp-2">{description}</div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-semibold mb-2">Social Media Preview</h4>
        <div className="border rounded overflow-hidden">
          <div className="bg-gray-100 h-32 flex items-center justify-center text-gray-400">
            {formData?.meta?.image ? <span>Image Preview</span> : <span>No OG Image Selected</span>}
          </div>
          <div className="p-3">
            <div className="font-bold text-base mb-1 truncate">{title}</div>
            <div className="text-sm text-gray-600 line-clamp-2">{description}</div>
            <div className="text-xs text-gray-500 mt-1 truncate">{canonicalURL}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SEOPreview
