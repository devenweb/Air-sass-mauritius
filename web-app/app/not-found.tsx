import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-9xl font-black text-red-600 mb-4">404</h1>
                <h2 className="text-4xl font-black text-slate-900 mb-4">Page Not Found</h2>
                <p className="text-lg text-slate-600 mb-4">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-red-600/20"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
    )
}
