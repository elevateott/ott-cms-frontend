'use client'

import React from 'react'

interface SubtitleTrackRowLabelProps {
  data: {
    name?: string
    language?: string
  }
}

const SubtitleTrackRowLabel: React.FC<SubtitleTrackRowLabelProps> = ({ data }) => {
  if (data?.name) {
    return `${data.name} (${data.language})`
  } else if (data?.language) {
    return `${data.language} Subtitles`
  } else {
    return 'Subtitle Track'
  }
}

export default SubtitleTrackRowLabel
