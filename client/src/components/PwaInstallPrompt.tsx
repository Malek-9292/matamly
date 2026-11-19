import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "matamly-install-dismissed-at";
const DISMISS_DAYS = 14;

function isRecentlyDismissed() {
  try {
    const value = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return value > 0 && Date.now() - value < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIosDevice = /iphone|ipad|ipod/i.test(ua);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setIos(isIosDevice);
    setStandalone(isStandalone);
    if (isStandalone || isRecentlyDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no programmatic install prompt; show concise instructions instead.
    if (isIosDevice) {
      const timer = window.setTimeout(() => setVisible(true), 1800);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setInstallEvent(null);
  };

  if (!visible || standalone) return null;

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-2xl border border-[#dce5d9] bg-white p-4 text-right shadow-2xl" dir="rtl" role="dialog" aria-label="تثبيت تطبيق فتوش">
      <button type="button" onClick={dismiss} aria-label="إغلاق" className="absolute left-3 top-3 rounded-full p-1 text-gray-500 hover:bg-gray-100">
        <X size={18} />
      </button>
      <div className="flex items-start gap-3 pl-7">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef4eb] text-[#3A4A37]">
          <Download size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-base text-gray-900">ثبّت فتوش على موبايلك</strong>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            {ios
              ? <>اضغط على زر المشاركة <Share className="inline-block align-text-bottom" size={15} /> في Safari، ثم اختر «إضافة إلى الشاشة الرئيسية».</>
              : installEvent
                ? "خلّي الطلب من فتوش أسرع؛ أضف الموقع إلى الشاشة الرئيسية."
                : "لإضافة الموقع للشاشة الرئيسية، افتح قائمة المتصفح واختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق»."}
          </p>
          {installEvent && !ios && (
            <button type="button" onClick={install} className="mt-3 rounded-xl bg-[#3A4A37] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              تثبيت التطبيق
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
