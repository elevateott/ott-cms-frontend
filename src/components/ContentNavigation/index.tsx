'use client'

import { clientLogger } from '@/utils/clientLogger'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Film, Layers, PlayCircle, FolderTree } from 'lucide-react'

type Category = {
  id: string
  title: string
  slug: string
}

export const ContentNavigation: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Support both old and new featured fields for backward compatibility
        const response = await fetch('/api/categories?featuredOn=nav&showInCatalog=true')
        if (!response.ok) throw new Error('Failed to fetch categories')
        const data = await response.json()
        setCategories(data.docs || [])
      } catch (error) {
        clientLogger.error('Error fetching categories:', error, 'ContentNavigationindex')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <nav className="flex items-center space-x-4">
      <Link href="/content" passHref>
        <Button
          variant={pathname === '/content' ? 'default' : 'ghost'}
          className="flex items-center gap-2"
        >
          <Film className="h-4 w-4" />
          <span>Content Library</span>
        </Button>
      </Link>

      <Link href="/series" passHref>
        <Button
          variant={pathname === '/series' ? 'default' : 'ghost'}
          className="flex items-center gap-2"
        >
          <Layers className="h-4 w-4" />
          <span>Series</span>
        </Button>
      </Link>

      <Link href="/video" passHref>
        <Button
          variant={pathname === '/video' ? 'default' : 'ghost'}
          className="flex items-center gap-2"
        >
          <PlayCircle className="h-4 w-4" />
          <span>Videos</span>
        </Button>
      </Link>

      {!loading && categories.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              <span>Categories</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {categories.map((category) => (
              <DropdownMenuItem key={category.id} asChild>
                <Link href={`/category/${category.slug}`}>{category.title}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem asChild>
              <Link href="/categories">All Categories</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  )
}

export default ContentNavigation
