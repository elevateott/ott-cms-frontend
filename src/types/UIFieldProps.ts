import type { Field } from 'payload'

export interface UIFieldProps {
  path: string
  value?: unknown
  onChange?: (value: unknown) => void
  preferencesKey?: string
  operation?: 'create' | 'update'
  user?: {
    id: string
    email?: string
    roles?: string[]
  }
  field: Field & {
    admin?: {
      description?: string
      // Any other admin settings you expect
    }
  }

  // 👇 Extra props passed through `FieldProps`
  [key: string]: unknown
}
