import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-3 h-3 bg-pop rounded-full mx-auto mb-6" />
        <h1 className="font-syne font-extrabold text-2xl text-ink mb-3">
          Page not found
        </h1>
        <p className="text-muted text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block py-3 px-6 bg-ink text-white text-sm font-semibold rounded-lg hover:bg-ink/90 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
