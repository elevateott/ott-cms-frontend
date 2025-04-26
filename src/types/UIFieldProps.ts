// src/types/UIFieldProps.ts

import type { PayloadComponent } from 'payload'

export type UIFieldComponent = PayloadComponent<never, UIFieldProps>

export type UIFieldProps = {
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

/* Example usage:
  'use client';

  import { UIFieldComponent } from '@/types/UIFieldProps'; // <-- clean import

  export const CloudIntegrationInstructions: UIFieldComponent = (_props) => {
    return (
      <div>
        <strong>Cloud Integration Setup Instructions</strong>
      </div>
    );
  };

  export default CloudIntegrationInstructions;
*/
