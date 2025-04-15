'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import Image from 'next/image'

const ThumbnailCell = (props: DefaultCellComponentProps) => {
  const { rowData, className } = props

  const thumbnail = rowData?.thumbnail?.url
  const muxThumbnail = rowData?.muxThumbnailUrl
  const muxStatus = rowData?.muxData?.status
  const imageUrl = thumbnail || muxThumbnail || '/media/fallback-thumbnail-1-600x600.png'

  console.log('ThumbnailCell rowData:', rowData)
  console.log('status', muxStatus)

  const renderContent = () => {
    switch (muxStatus) {
      case 'uploading':
      case 'processing':
        return (
          <div className="spinner-wrapper">
            <div className="lds-spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="flex items-center justify-center w-full h-full text-red-600 font-semibold">
            Error
          </div>
        )

      case 'ready':
      default:
        return (
          <Image
            src={imageUrl}
            alt="Video Thumbnail"
            width={100}
            height={56}
            className="object-cover w-full h-full"
          />
        )
    }
  }

  return (
    <div className={className}>
      <div className="relative w-[100px] h-[56px] rounded overflow-hidden bg-gray-100">
        {renderContent()}
      </div>
    </div>
  )
}

export default ThumbnailCell
