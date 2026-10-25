import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker with Badging and Notification handlers
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.debug('PWA Service Worker registration error:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

