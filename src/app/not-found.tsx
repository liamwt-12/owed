export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-3 h-3 bg-pop rounded-full mx-auto mb-6" />
        <h1 className="font-syne font-extrabold text-2xl text-ink mb-3">
          Page not found
        </h1>
        <p className="text-muted text-sm mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/" className="inline-block py-3 px-6 bg-ink text-white text-sm font-semibold rounded-lg hover:bg-ink/90 transition-colors">Back to homepage</a>
          <a href="/login" className="inline-block py-3 px-6 bg-white text-ink text-sm font-semibold rounded-lg border border-line hover:border-ink transition-colors">Log in</a>
        </div>
      </div>
    </div>
  )
}
