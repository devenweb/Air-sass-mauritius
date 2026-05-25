'use client';

// PROD GATE: This route is blocked in production environments.
// It is intentionally kept for development/staging SMTP synthetic testing only.
import { notFound } from 'next/navigation';
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Mail, 
  BarChart3,
  RefreshCw,
  Info
} from 'lucide-react';

export default function SyntheticTestPage() {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const runTests = async () => {
        setStatus('running');
        setError(null);
        try {
            const response = await fetch('/api/synthetic-test', { method: 'POST' });
            const data = await response.json();
            
            if (response.ok) {
                setResults(data);
                setStatus('success');
            } else {
                setError(data.error || 'Failed to complete synthetic tests');
                setStatus('error');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <ShieldCheck size={200} />
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-red-100">
                                    Infrastructure Validator
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Synthetic E2E Testing</h1>
                            <p className="text-slate-500 font-medium max-w-xl">
                                Trigger end-to-end SMTP validation across all transactional forms and the full distribution list.
                                This ensures all templates, CC rules, and centralized credentials are functional.
                            </p>
                        </div>
                        
                        <button
                            onClick={runTests}
                            disabled={status === 'running'}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95 ${
                                status === 'running' 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-black text-white hover:bg-slate-900 shadow-black/10'
                            }`}
                        >
                            {status === 'running' ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Running Diagnostics...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Launch Synthetic Test
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Info Bar */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 flex items-start gap-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <Info size={20} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider">Distribution List & Scope</h4>
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            Tests will be sent to: <span className="font-bold underline">kevinadlib@gmail.com</span>, 
                            <span className="font-bold underline ml-1">reservation@royaltravel.mu</span>, 
                            <span className="font-bold underline ml-1">inbound@royaltravel.mu</span>, 
                            <span className="font-bold underline ml-1 text-blue-900">sales2@royaltravel.mu</span>. 
                            Templates: Booking Confirmation, Admin Booking, Inquiry Received, Admin Inquiry.
                        </p>
                    </div>
                </div>

                {/* Results Section */}
                {status === 'success' && results && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-inner">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate</div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {((results.successful / results.totalSent) * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sent</div>
                                    <div className="text-2xl font-black text-slate-900">{results.totalSent}</div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                                    <RefreshCw size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Run</div>
                                    <div className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                                        {new Date(results.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                                    <BarChart3 size={14} className="text-red-600" />
                                    Detailed Transaction Log
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="px-8 py-4">Recipient</th>
                                            <th className="px-8 py-4">Template</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4">Message ID / Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {results.details.map((res: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-4">
                                                    <span className="text-sm font-bold text-slate-700">{res.recipient}</span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">
                                                        {res.template.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    {res.success ? (
                                                        <span className="flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase tracking-widest">
                                                            <CheckCircle2 size={12} /> Delivered
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-red-600 text-[10px] font-black uppercase tracking-widest">
                                                            <XCircle size={12} /> Failed
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-4">
                                                    <code className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                        {res.success ? (res.messageId || 'N/A') : (res.error || 'Unknown Error')}
                                                    </code>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-lg shadow-red-200/50">
                            <XCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-red-900 tracking-tight">Test Suite Failed</h3>
                        <p className="text-red-700 text-sm font-medium max-w-md mx-auto">
                            {error}
                        </p>
                        <button 
                            onClick={runTests}
                            className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                        >
                            Retry Diagnostics
                        </button>
                    </div>
                )}

                {/* Idle State / Placeholder */}
                {status === 'idle' && (
                    <div className="border-2 border-dashed border-slate-200 rounded-[40px] py-20 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                            <RefreshCw size={40} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-400">Ready for Validation</h3>
                            <p className="text-slate-400 text-sm max-w-xs mt-1 font-medium">Click the button above to begin the end-to-end synthetic test sequence.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
