import { Field } from 'payload/types'

export const muxUploaderField: Field = {
  name: 'muxUploader',
  type: 'text' as const,
  admin: {
    condition: (data) => data?.sourceType === 'mux',
    description: 'Upload your video directly to Mux',
    components: {
      Field: '@/collections/Videos/components/MuxUploadField',
    },
  },
}
