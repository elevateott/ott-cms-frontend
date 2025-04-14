'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { Link } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/utilities/formatAdminURL'

const ThumbnailCell = (props: DefaultCellComponentProps) => {
  const { cellData, rowData, collectionSlug, link, className } = props

  const thumbnail = rowData?.thumbnail?.url
  const muxThumbnail = rowData?.muxThumbnailUrl
  const muxStatus = rowData?.muxData?.status
  const isLoading = muxStatus !== 'ready'
  const imageUrl = thumbnail || muxThumbnail || '/media/fallback-thumbnail-1-600x600.png'

  console.log('ThumbnailCell', { cellData, rowData, collectionSlug, link, className })
  console.log('status', muxStatus)

  const content = (
    <div className="relative w-[100px] h-[56px] rounded overflow-hidden bg-gray-100">
      {isLoading ? (
        <div className="spinner" />
      ) : (
        <Image
          src={imageUrl}
          alt="Video Thumbnail"
          width={100}
          height={56}
          className="object-cover w-full h-full"
        />
      )}
    </div>
  )

  return <div className={className}>{content}</div>

  //return <div>Test Custom Cell</div>
  // return (
  //   <div>
  //     <Image src={imageUrl} alt="Video Thumbnail" sizes="100px" width={100} height={100} />
  //   </div>
  // )
}

export default ThumbnailCell
