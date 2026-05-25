'use client';

// PROD GATE: This route is blocked in production environments.
// It is intentionally kept for development/staging email diagnostics only.
import { notFound } from 'next/navigation';
import { useState } from 'react';

export default function TestEmailPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [debugResults, setDebugResults] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  const handleTestEmail = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/test-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'An error occurred');
        if (data.env) {
          setResult(data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepDebug = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setDebugLoading(true);
    setError('');
    setDebugResults(null);

    try {
      const response = await fetch(`/api/email-debug?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setDebugResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected debug error occurred');
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Email Test Page</h1>
        
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to test"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter an email address to send test emails to
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            <strong className="block mb-1">Error:</strong>
            <p className="break-all">{error}</p>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleTestEmail}
            disabled={loading || debugLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {loading ? 'Sending...' : 'Send Test Emails'}
          </button>

          <button
            onClick={handleDeepDebug}
            disabled={loading || debugLoading}
            className={`w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              debugLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {debugLoading ? 'Testing All Ports...' : 'Run Deep SMTP Diagnostic'}
          </button>
        </div>

        {result && (
          <div className="mt-8 p-4 bg-green-50 rounded-md border border-green-200">
            <h2 className="text-lg font-medium text-green-800">Success!</h2>
            <div className="mt-2 text-sm text-green-700">
              <p><strong>Status:</strong> Successful</p>
              <p><strong>Email sent to:</strong> {result.testEmail}</p>
              <p><strong>Timestamp:</strong> {result.timestamp}</p>
              
              {result.bookingMessageId && (
                <p><strong>Booking Message ID:</strong> {result.bookingMessageId}</p>
              )}
            </div>
          </div>
        )}

        {debugResults && (
          <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Diagnostic Results</h3>
            <div className="space-y-4">
              {debugResults.results.map((res: any, idx: number) => (
                <div key={idx} className="text-xs p-2 rounded bg-white border border-gray-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-800">{res.label}</span>
                    <span className={res.success ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {res.success ? "✅ OK" : "❌ FAIL"}
                    </span>
                  </div>
                  {!res.success && (
                    <p className="text-[10px] text-red-500 font-mono break-all mt-1">
                      {res.error}
                    </p>
                  )}
                  {res.success && (
                    <p className="text-[10px] text-green-500 font-mono mt-1">
                      Message sent successfully.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostic Section */}
        {(result?.env || error) && (
          <div className="mt-8 p-4 bg-gray-100 rounded-md border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">System Snapshot</h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-gray-500">SMTP Host:</div>
              <div className={result?.env?.MAIL_SERVER_URL ? "text-green-600" : "text-red-600 font-bold"}>
                {result?.env?.MAIL_SERVER_URL ? "✅ Configured" : "❌ MISSING"}
              </div>
              
              <div className="text-gray-500">SMTP Port:</div>
              <div className="text-blue-600">{result?.env?.MAIL_SERVER_PORT || "587 (Default)"}</div>
              
              <div className="text-gray-500">SMTP Login:</div>
              <div className={result?.env?.MAIL_SERVER_LOGIN ? "text-green-600" : "text-red-600 font-bold"}>
                {result?.env?.MAIL_SERVER_LOGIN ? "✅ Configured" : "❌ MISSING"}
              </div>

              <div className="text-gray-500">From Email:</div>
              <div className="text-gray-900 text-[10px] break-all">{result?.env?.MAIL_FROM_EMAIL || "Not Set"}</div>

              <div className="text-gray-500">Effective From:</div>
              <div className="text-gray-900 text-[10px] break-all">{result?.env?.EFFECTIVE_FROM || "Not Set"}</div>

              <div className="text-gray-500">Node Env:</div>
              <div className="text-gray-900">{result?.env?.node_env || "Unknown"}</div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Troubleshooting:</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you get <strong>EBUSY</strong> or <strong>ETIMEDOUT</strong>, it usually means the SMTP provider is blocking the connection or the hostname is invalid on the server network.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-gray-500">
            <li>Try Port 587 (Standard TLS)</li>
            <li>Try Port 465 (Implicit SSL)</li>
            <li>Use the direct IP address to bypass DNS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}