'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const TestCustomCell = (props: DefaultCellComponentProps) => {
  return (
    <div>
      Test Custom Cell
      <pre>{JSON.stringify(props)}</pre>
    </div>
  )
}

export default TestCustomCell
