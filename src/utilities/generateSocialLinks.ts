/**
 * Utility function to generate social sharing links for content
 * 
 * This function takes a title and slug and generates sharing links for various social platforms
 * as well as an embed code for embedding the content on other websites.
 */

import { getServerSideURL } from './getURL'

export type SocialLinksOptions = {
  title: string
  slug: string
  collection: 'content' | 'series'
  imageUrl?: string
  description?: string
}

export type SocialLinks = {
  url: string
  facebook: string
  twitter: string
  linkedin: string
  whatsapp: string
  embedCode: string
  embedCardCode: string
}

/**
 * Generate social sharing links and embed codes for content
 */
export const generateSocialLinks = ({
  title,
  slug,
  collection,
  imageUrl,
  description = '',
}: SocialLinksOptions): SocialLinks => {
  // Get the base URL from environment or use a default
  const baseURL = getServerSideURL()
  
  // Generate the full URL to the content
  const url = `${baseURL}/${collection}/${slug}`
  
  // Encode the URL and title for use in sharing links
  const encodedURL = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description.slice(0, 160))
  
  // Generate the embed code with iframe
  const embedCode = `<iframe src="${url}/embed" width="560" height="315" frameborder="0" allowfullscreen></iframe>`
  
  // Generate a simpler embed card with image + link
  const embedCardCode = `<a href="${url}" style="display:block; max-width:500px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; text-decoration:none; color:inherit;">
  ${imageUrl ? `<img src="${imageUrl}" style="width:100%; height:auto;" alt="${encodedTitle}" />` : ''}
  <div style="padding:16px;">
    <h3 style="margin:0 0 8px; font-size:18px;">${title}</h3>
    ${description ? `<p style="margin:0; font-size:14px; color:#4a5568;">${description.slice(0, 100)}${description.length > 100 ? '...' : ''}</p>` : ''}
  </div>
</a>`
  
  // Return all the sharing links and embed codes
  return {
    url,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedURL}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedURL}&title=${encodedTitle}&summary=${encodedDescription}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedURL}`,
    embedCode,
    embedCardCode,
  }
}
