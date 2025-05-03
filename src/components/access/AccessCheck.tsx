'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { clientLogger } from '@/utils/clientLogger';

interface AccessCheckProps {
  eventId?: string;
  contentId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Component to check if a user has access to content or an event
 * 
 * This component fetches access status from the API and renders
 * either the children or a fallback component based on the result.
 */
export const AccessCheck: React.FC<AccessCheckProps> = ({
  eventId,
  contentId,
  children,
  fallback,
  loadingComponent,
}) => {
  const { isLoggedIn } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // If not logged in, deny access immediately
    if (!isLoggedIn) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }
    
    // If no event or content ID, deny access
    if (!eventId && !contentId) {
      clientLogger.error('AccessCheck component requires either eventId or contentId');
      setHasAccess(false);
      setIsLoading(false);
      return;
    }
    
    // Check access via API
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        
        // Build the query parameter
        const queryParam = eventId 
          ? `eventId=${eventId}` 
          : `contentId=${contentId}`;
        
        const response = await fetch(`/api/access-check?${queryParam}`);
        
        if (!response.ok) {
          throw new Error('Failed to check access status');
        }
        
        const { hasAccess } = await response.json();
        setHasAccess(hasAccess);
      } catch (err) {
        clientLogger.error('Error checking access:', err);
        // Default to no access on error
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [eventId, contentId, isLoggedIn]);
  
  // Show loading state
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Checking access...</span>
      </div>
    );
  }
  
  // Show content or fallback based on access
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default AccessCheck;
