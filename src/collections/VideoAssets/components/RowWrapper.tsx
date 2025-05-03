'use client'

import React, { createContext, useContext, useState } from 'react'

// Create a context to share the deletion state across cells in the same row
export const RowDeletingContext = createContext<{
  isDeleting: boolean
  setIsDeleting: (value: boolean) => void
}>({
  isDeleting: false,
  setIsDeleting: () => {},
})

// Hook to use the row deleting context
export const useRowDeleting = () => useContext(RowDeletingContext)

// Props for the RowWrapper component
type RowWrapperProps = {
  children: React.ReactNode
  rowData: {
    id: string
    [key: string]: any
  }
}

const RowWrapper: React.FC<RowWrapperProps> = ({ children, rowData }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <RowDeletingContext.Provider value={{ isDeleting, setIsDeleting }}>
      <tr className={`relative ${isDeleting ? 'opacity-50' : ''}`}>
        {isDeleting && (
          <td className="absolute left-0 top-0 w-full h-full flex items-center justify-center bg-white bg-opacity-30 z-10">
            <div className="bg-white px-3 py-1 rounded-md shadow-md flex items-center text-red-600 font-medium">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting...
            </div>
          </td>
        )}
        {children}
      </tr>
    </RowDeletingContext.Provider>
  )
}

export default RowWrapper
