import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (window.__appBootTimeout) {
  clearTimeout(window.__appBootTimeout);
  window.__appBootTimeout = null;
}

// Detect iOS (Safari on iPhone/iPad) — used to disable expensive CSS effects
// like backdrop-filter that cause severe jank on older iOS devices.
(function detectIOS() {
  try {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) document.documentElement.classList.add('is-ios');
    // Also detect older / low-power devices to disable heavy animations
    const lowPower = isIOS && (
      /OS 1[0-3]_/.test(ua) || // iOS 10-13
      navigator.hardwareConcurrency <= 2 ||
      navigator.deviceMemory <= 2
    );
    if (lowPower) document.documentElement.classList.add('is-low-power');
  } catch (_) {}
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
