import Link from 'next/link'

const UploadButton: React.FC = () => {
  return (
    <div className="mb-4">
      <Link
        href="/admin/collections/videos"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Manage Videos
      </Link>
    </div>
  )
}

export default UploadButton
