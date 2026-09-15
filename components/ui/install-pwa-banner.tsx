"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";
import { Button } from "./button";

const subscribeStandalone = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

const getStandaloneSnapshot = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true);

export function InstallPWABanner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandaloneSnapshot, () => false);
  const isIOS = typeof window !== "undefined" && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined" || isStandalone) return false;
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    return Boolean(isIOS && !dismissed);
  });
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    // Capture Chrome / Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (isStandalone || !isVisible) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[#1d1e1c] text-white p-4 rounded-[20px] shadow-2xl border border-[#fa5d00]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-2xl bg-[#fa5d00] text-white flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="size-6" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">Install Mobile Web App</h4>
              <p className="text-xs text-[#c0bbb6] truncate">Use directly without browser controls</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleInstallClick}
              className="text-xs px-3.5 py-2 font-bold shadow-md"
            >
              <Download className="size-3.5" /> Install
            </Button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="p-1.5 rounded-full text-[#8e8b87] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white text-[#1d1e1c] rounded-[24px] p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 border border-[#e3d6c5]">
            <div className="flex items-center justify-between pb-2 border-b border-[#e3d6c5]">
              <h3 className="font-bold text-lg text-[#1d1e1c]">Add to Home Screen</h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="p-1 text-[#8e8b87] hover:text-[#1d1e1c]"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-[#615f5c]">
              To use Finance Tracker as a standalone mobile app on iPhone/iPad:
            </p>

            <ol className="space-y-3 text-xs font-medium text-[#1d1e1c]">
              <li className="flex items-center gap-2 bg-[#fff8f1] p-2.5 rounded-xl border border-[#e3d6c5]">
                <span className="flex items-center justify-center size-6 rounded-full bg-[#fa5d00] text-white text-xs font-bold">1</span>
                <span>Tap the <Share className="inline size-4 text-[#fa5d00]" /> <b>Share</b> button in Safari browser toolbar.</span>
              </li>
              <li className="flex items-center gap-2 bg-[#fff8f1] p-2.5 rounded-xl border border-[#e3d6c5]">
                <span className="flex items-center justify-center size-6 rounded-full bg-[#fa5d00] text-white text-xs font-bold">2</span>
                <span>Scroll down and tap <PlusSquare className="inline size-4 text-[#fa5d00]" /> <b>Add to Home Screen</b>.</span>
              </li>
              <li className="flex items-center gap-2 bg-[#fff8f1] p-2.5 rounded-xl border border-[#e3d6c5]">
                <span className="flex items-center justify-center size-6 rounded-full bg-[#fa5d00] text-white text-xs font-bold">3</span>
                <span>Tap <b>Add</b> in top right corner. Enjoy your app!</span>
              </li>
            </ol>

            <Button variant="primary" size="md" onClick={() => setShowIOSInstructions(false)} className="w-full">
              Got it!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
