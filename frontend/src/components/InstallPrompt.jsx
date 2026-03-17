import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    if (ios) {
      // Show iOS install guide if not dismissed before
      const dismissed = localStorage.getItem('install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
      return;
    }

    // Android/Chrome install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('install-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('install-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-16 left-0 right-0 z-[100] px-4 pb-2 animate-slide-up">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-blue-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">ຕິດຕັ້ງແອັບ School Pickup</p>
              <p className="text-xs text-gray-500 mt-0.5">ເພີ່ມໃສ່ໜ້າຈໍ ໃຊ້ງານໄດ້ງ່າຍຂຶ້ນ</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 px-3 text-sm text-gray-500 bg-gray-100 rounded-xl font-medium"
            >
              ທີຫຼັງ
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2 px-3 text-sm text-white bg-blue-600 rounded-xl font-medium flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              ຕິດຕັ້ງ
            </button>
          </div>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center" onClick={handleDismiss}>
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 text-center mb-4">ວິທີຕິດຕັ້ງໃນ iPhone</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                <p className="text-sm text-gray-700">ກົດປຸ່ມ <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs">⎙ Share</span> ຢູ່ລຸ່ມ Safari</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                <p className="text-sm text-gray-700">ເລືອກ <strong>"Add to Home Screen"</strong></p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
                <p className="text-sm text-gray-700">ກົດ <strong>"Add"</strong> ເພື່ອຕິດຕັ້ງ</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-medium">ເຂົ້າໃຈແລ້ວ</button>
          </div>
        </div>
      )}
    </>
  );
}
