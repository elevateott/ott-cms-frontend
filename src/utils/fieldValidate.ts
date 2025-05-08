// utils/fieldValidate.ts

export type FieldValidate<T = unknown> = (
  value: T | null | undefined,
  context: {
    data?: Record<string, unknown>
    siblingData?: Record<string, unknown>
    operation?: 'create' | 'update'
    id?: string | number
    user?: unknown
    payload?: unknown
  },
) => boolean | string | Promise<boolean | string>
