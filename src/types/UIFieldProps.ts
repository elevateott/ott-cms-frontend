// src/types/UIFieldProps.ts
export interface UIFieldProps {
  path: string
  field: {
    name: string
    label?: string
    admin?: {
      description?: string
    }
  }
  value?: unknown
  onChange?: (value: unknown) => void
  preferencesKey?: string
  operation?: 'create' | 'update'
  user?: {
    id: string
    email?: string
    roles?: string[]
  }
}
