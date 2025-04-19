/**
 * Type definitions for Payload CMS
 */

// User types
export interface PayloadUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  roles?: string[]
  createdAt: string
  updatedAt: string
  [key: string]: any
}

// Media types
export interface PayloadMedia {
  id: string
  filename: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  url: string
  alt?: string
  createdAt: string
  updatedAt: string
}

// Category types
export interface PayloadCategory {
  id: string
  name: string
  slug: string
  description?: string
  parent?: string | PayloadCategory
  createdAt: string
  updatedAt: string
}

// Pagination types
export interface PayloadPaginationInfo {
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

export interface PayloadPaginatedDocs<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

// Where clause types
export type PayloadWhereField<T> = {
  equals?: T
  not_equals?: T
  greater_than?: T
  greater_than_equal?: T
  less_than?: T
  less_than_equal?: T
  like?: string
  contains?: string
  in?: T[]
  not_in?: T[]
  all?: T[]
  exists?: boolean
}

export type PayloadWhereClause = {
  [key: string]: PayloadWhereField<any> | PayloadWhereClause | PayloadWhereClause[] | undefined
} & {
  AND?: PayloadWhereClause[]
  OR?: PayloadWhereClause[]
}

// Query options
export interface PayloadQueryOptions {
  depth?: number
  draft?: boolean
  locale?: string
  fallbackLocale?: string
}

// Find options
export interface PayloadFindOptions extends PayloadQueryOptions {
  where?: PayloadWhereClause
  sort?: string | string[]
  limit?: number
  page?: number
}

// Auth types
export interface PayloadAuthOptions {
  collection?: string
  depth?: number
  token?: string
  headers?: Record<string, string>
}
