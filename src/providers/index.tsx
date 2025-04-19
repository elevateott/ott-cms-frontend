import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { EventProvider } from '@/components/EventProvider'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <EventProvider>{children}</EventProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
