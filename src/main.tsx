import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App caught unexpected error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errStr = this.state.error?.message || String(this.state.error || 'Unknown error');
      return (
        <div className="min-h-screen bg-[#0c2e22] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-lg">
            <span className="font-serif font-black text-2xl">T</span>
          </div>
          <h1 className="text-xl font-bold text-amber-200">TapMenu Luxury Dining</h1>
          <p className="text-xs text-neutral-300 mt-2 max-w-sm">
            Something unexpected occurred. Tap below to reload your digital menu.
          </p>
          <div className="mt-3 p-3 bg-black/40 border border-amber-500/30 rounded-xl text-[11px] font-mono text-amber-300 max-w-xs overflow-x-auto text-left break-words">
            {errStr}
          </div>
          <button
            onClick={() => {
              sessionStorage.clear();
              localStorage.removeItem('dinetap_orders_v3');
              window.location.reload();
            }}
            className="mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors shadow-lg active:scale-95 cursor-pointer"
          >
            Reload Menu
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Register PWA Service Worker with Badging and Notification handlers
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.debug('PWA Service Worker registration error:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
