// src/globals/streamingSources.ts
import type { GlobalConfig } from 'payload'

const StreamingSources: GlobalConfig = {
  slug: 'streaming-sources',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'allowedSources',
      label: 'Allowed Streaming Source Types',
      type: 'select',
      defaultValue: 'Mux',
      options: [
        { label: 'Mux Only', value: 'Mux' },
        { label: 'Embedded Only', value: 'Embedded' },
        { label: 'Both', value: 'Both' },
      ],
      required: true,
    },
  ],
}

export default StreamingSources
