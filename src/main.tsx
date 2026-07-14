import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Detect if we are in development or within the AI Studio preview frame
const isDevContext = typeof window !== 'undefined' && (
  window.location.hostname.includes('localhost') || 
  window.location.hostname.includes('ais-dev') || 
  window.location.hostname.includes('ais-pre') ||
  window !== window.parent
);

if (isDevContext) {
  // Active Service Worker Unregistration to fix reload loops, flickering, and blank screens in dev preview frames
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Successfully unregistered active service worker for stability in dev preview.');
          }
        });
      }
    }).catch((err) => {
      console.error('Error unregistering service worker:', err);
    });
  }
} else {
  // Register service worker normally in the live production app environment
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    registerSW({
      onNeedRefresh() {
        console.log('EFADO: New application updates available. Please reload.');
      },
      onOfflineReady() {
        console.log('EFADO: Application cache primed and fully ready for offline usage!');
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
