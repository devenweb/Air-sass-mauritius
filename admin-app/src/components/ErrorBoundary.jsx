import React from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden text-center p-12 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-red"></div>
            
            <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-brand-red">
              <AlertTriangle size={36} />
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">System Alert</h1>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              An unexpected runtime exception has occurred within the application engine. Our telemetry has logged this event for forensic analysis.
            </p>

            <div className="space-y-4">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-brand-red hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-red-100"
              >
                <RefreshCcw size={16} />
                Refresh Application
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full border-2 border-slate-300 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-50"
              >
                <Home size={16} />
                Return to Command Center
              </Button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                Diagnostic Code: ERR_RUNTIME_UNCAUGHT
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
